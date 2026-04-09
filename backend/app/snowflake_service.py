from __future__ import annotations

import os
import re
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path
from time import perf_counter
from typing import Any, Dict, Optional

import snowflake.connector
from snowflake.connector import DictCursor

from .models import (
    SnowflakeConnectionInfo,
    SnowflakeProbeResult,
    SnowflakeQueryRequest,
    SnowflakeQueryResponse,
    SnowflakeStatusResponse,
)


QUERY_TAG = "m365_copilot_adoption_command_center"
QUERY_EXAMPLES = [
    "select current_account() as account, current_user() as username, current_warehouse() as warehouse, current_database() as database_name, current_schema() as schema_name",
    "select table_catalog, table_schema, table_name from information_schema.tables order by table_schema, table_name limit 10",
    "show schemas",
]
WRITE_KEYWORDS = re.compile(
    r"\b(insert|update|delete|merge|alter|drop|truncate|create|grant|revoke|call|copy|put|get|remove|use)\b",
    re.IGNORECASE,
)
COMMENT_PATTERN = re.compile(r"(--[^\n]*$|/\*.*?\*/)", re.MULTILINE | re.DOTALL)


class SnowflakeServiceError(RuntimeError):
    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.status_code = status_code


def _candidate_roots() -> list[Path]:
    roots: list[Path] = []
    custom_root = os.getenv("SNOWFLAKE_HOME")
    if custom_root:
        roots.append(Path(custom_root).expanduser())
    roots.extend(
        [
            Path.home() / ".snowflake",
            Path.home() / "Library" / "Application Support" / "snowflake",
            Path.home() / ".config" / "snowflake",
        ]
    )
    deduped: list[Path] = []
    for root in roots:
        if root not in deduped:
            deduped.append(root)
    return deduped


def _parse_simple_toml(path: Path) -> dict[str, dict[str, str]]:
    sections: dict[str, dict[str, str]] = {"__root__": {}}
    current = "__root__"
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            continue
        if line.startswith("[") and line.endswith("]"):
            current = line[1:-1].strip()
            sections.setdefault(current, {})
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1]
        sections.setdefault(current, {})[key] = value
    return sections


def _connection_info_from_values(
    *,
    config_source: str,
    connection_name: Optional[str],
    values: dict[str, str],
    profile_path: Optional[Path],
) -> SnowflakeConnectionInfo:
    return SnowflakeConnectionInfo(
        config_source=config_source,  # type: ignore[arg-type]
        connection_name=connection_name,
        account=values.get("account"),
        user=values.get("user"),
        warehouse=values.get("warehouse"),
        database=values.get("database"),
        schema_name=values.get("schema"),
        role=values.get("role"),
        authenticator=values.get("authenticator"),
        profile_path=str(profile_path) if profile_path else None,
    )


def _resolve_from_connections_file(explicit_name: Optional[str]) -> Optional[SnowflakeConnectionInfo]:
    target_name = explicit_name or "default"
    for root in _candidate_roots():
        path = root / "connections.toml"
        if not path.exists():
            continue
        sections = _parse_simple_toml(path)
        if target_name in sections:
            return _connection_info_from_values(
                config_source="connections.toml",
                connection_name=target_name,
                values=sections[target_name],
                profile_path=path,
            )
    return None


def _resolve_from_config_file(explicit_name: Optional[str]) -> Optional[SnowflakeConnectionInfo]:
    for root in _candidate_roots():
        path = root / "config.toml"
        if not path.exists():
            continue
        sections = _parse_simple_toml(path)
        target_name = explicit_name or sections.get("__root__", {}).get("default_connection_name")
        if not target_name:
            continue
        connection_section = f"connections.{target_name}"
        if connection_section in sections:
            return _connection_info_from_values(
                config_source="config.toml",
                connection_name=target_name,
                values=sections[connection_section],
                profile_path=path,
            )
    return None


def detect_snowflake_connection() -> SnowflakeConnectionInfo:
    env_account = os.getenv("SNOWFLAKE_ACCOUNT")
    env_user = os.getenv("SNOWFLAKE_USER")
    if env_account and env_user:
        return _connection_info_from_values(
            config_source="env",
            connection_name=os.getenv("SNOWFLAKE_CONNECTION_NAME"),
            values={
                "account": env_account,
                "user": env_user,
                "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE", ""),
                "database": os.getenv("SNOWFLAKE_DATABASE", ""),
                "schema": os.getenv("SNOWFLAKE_SCHEMA", ""),
                "role": os.getenv("SNOWFLAKE_ROLE", ""),
                "authenticator": os.getenv("SNOWFLAKE_AUTHENTICATOR", ""),
            },
            profile_path=None,
        )

    explicit_name = os.getenv("SNOWFLAKE_CONNECTION_NAME")
    from_connections = _resolve_from_connections_file(explicit_name)
    if from_connections is not None:
        return from_connections

    from_config = _resolve_from_config_file(explicit_name)
    if from_config is not None:
        return from_config

    return SnowflakeConnectionInfo(config_source="unconfigured")


def validate_read_only_sql(sql: str) -> str:
    normalized = COMMENT_PATTERN.sub(" ", sql).strip()
    if not normalized:
        raise SnowflakeServiceError("SQL is empty after stripping comments.", status_code=400)
    if normalized.endswith(";"):
        normalized = normalized[:-1].rstrip()
    if ";" in normalized:
        raise SnowflakeServiceError("Only single read-only statements are allowed.", status_code=400)
    lowered = normalized.lower()
    if not (lowered.startswith("select") or lowered.startswith("with") or lowered.startswith("show") or lowered.startswith("describe")):
        raise SnowflakeServiceError("Only SELECT, WITH, SHOW, and DESCRIBE statements are allowed.", status_code=400)
    if WRITE_KEYWORDS.search(lowered):
        raise SnowflakeServiceError("Only read-only Snowflake queries are allowed.", status_code=400)
    return normalized


def _connect(connection: SnowflakeConnectionInfo):
    session_parameters = {"QUERY_TAG": QUERY_TAG}
    if connection.config_source == "env":
        kwargs: dict[str, Any] = {
            "account": connection.account,
            "user": connection.user,
            "session_parameters": session_parameters,
            "login_timeout": 20,
            "network_timeout": 30,
        }
        password = os.getenv("SNOWFLAKE_PASSWORD")
        if password:
            kwargs["password"] = password
        authenticator = os.getenv("SNOWFLAKE_AUTHENTICATOR")
        if authenticator:
            kwargs["authenticator"] = authenticator
        if connection.warehouse:
            kwargs["warehouse"] = connection.warehouse
        if connection.database:
            kwargs["database"] = connection.database
        if connection.schema_name:
            kwargs["schema"] = connection.schema_name
        if connection.role:
            kwargs["role"] = connection.role
        return snowflake.connector.connect(**kwargs)

    if connection.connection_name:
        return snowflake.connector.connect(
            connection_name=connection.connection_name,
            session_parameters=session_parameters,
            login_timeout=20,
            network_timeout=30,
        )

    raise SnowflakeServiceError(
        "No Snowflake connection is configured. Set SNOWFLAKE_* environment variables or create ~/.snowflake/connections.toml.",
        status_code=503,
    )


def _normalize_value(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, dict):
        return {str(key): _normalize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalize_value(item) for item in value]
    return str(value)


def _message_for_status(connection: SnowflakeConnectionInfo, configured: bool) -> str:
    if not configured:
        return "No Snowflake connection profile was detected yet. Set SNOWFLAKE_* environment variables or create a Snowflake connection profile to enable live telemetry."
    if connection.config_source == "env":
        return "Snowflake is configured from explicit environment variables and can be probed from the backend."
    return (
        f"Detected Snowflake connection profile `{connection.connection_name}` from `{connection.profile_path}`. "
        "Run a probe to validate the current browser or SSO session."
    )


def probe_snowflake_connection(connection: Optional[SnowflakeConnectionInfo] = None) -> SnowflakeProbeResult:
    active_connection = connection or detect_snowflake_connection()
    if active_connection.config_source == "unconfigured":
        return SnowflakeProbeResult(status="error", error="Snowflake is not configured yet.")

    conn = None
    cur = None
    try:
        conn = _connect(active_connection)
        cur = conn.cursor()
        cur.execute(
            "select current_account() as account, current_user() as username, current_warehouse() as warehouse, "
            "current_database() as database_name, current_schema() as schema_name"
        )
        row = cur.fetchone()
        return SnowflakeProbeResult(
            status="connected",
            account=row[0],
            user=row[1],
            warehouse=row[2],
            database=row[3],
            schema_name=row[4],
            query_id=cur.sfqid,
        )
    except Exception as exc:  # pragma: no cover - exercised by integration on the user's machine
        return SnowflakeProbeResult(status="error", error=str(exc))
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


def get_snowflake_status(*, probe: bool = False) -> SnowflakeStatusResponse:
    connection = detect_snowflake_connection()
    configured = connection.config_source != "unconfigured"
    probe_result = SnowflakeProbeResult(status="not-run")
    if probe and configured:
        probe_result = probe_snowflake_connection(connection)
    return SnowflakeStatusResponse(
        backend_supported=True,
        configured=configured,
        message=_message_for_status(connection, configured),
        connection=connection,
        query_examples=QUERY_EXAMPLES,
        probe=probe_result,
    )


def run_snowflake_query(request: SnowflakeQueryRequest) -> SnowflakeQueryResponse:
    connection = detect_snowflake_connection()
    if connection.config_source == "unconfigured":
        raise SnowflakeServiceError(
            "Snowflake is not configured. Add SNOWFLAKE_* environment variables or a Snowflake profile first.",
            status_code=503,
        )

    sql = validate_read_only_sql(request.sql)
    conn = None
    cur = None
    started = perf_counter()
    try:
        conn = _connect(connection)
        cur = conn.cursor(DictCursor)
        cur.execute(sql)
        fetched = cur.fetchmany(request.max_rows + 1)
        truncated = len(fetched) > request.max_rows
        rows = [
            {str(key): _normalize_value(value) for key, value in row.items()}
            for row in fetched[: request.max_rows]
        ]
        columns = [column[0] for column in (cur.description or [])]
        duration_ms = int((perf_counter() - started) * 1000)
        return SnowflakeQueryResponse(
            ok=True,
            executed_sql=sql,
            query_id=cur.sfqid,
            columns=columns,
            rows=rows,
            row_count=len(rows),
            truncated=truncated,
            duration_ms=duration_ms,
            connection=connection,
        )
    except SnowflakeServiceError:
        raise
    except Exception as exc:  # pragma: no cover - exercised by integration on the user's machine
        raise SnowflakeServiceError(str(exc), status_code=502) from exc
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
