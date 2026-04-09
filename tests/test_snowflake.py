import pytest
from fastapi.testclient import TestClient

from backend.app import main
from backend.app.models import SnowflakeConnectionInfo, SnowflakeProbeResult, SnowflakeStatusResponse
from backend.app.snowflake_service import SnowflakeServiceError, get_snowflake_status, validate_read_only_sql


client = TestClient(main.app)


def _clear_snowflake_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in [
        "SNOWFLAKE_HOME",
        "SNOWFLAKE_CONNECTION_NAME",
        "SNOWFLAKE_ACCOUNT",
        "SNOWFLAKE_USER",
        "SNOWFLAKE_PASSWORD",
        "SNOWFLAKE_AUTHENTICATOR",
        "SNOWFLAKE_WAREHOUSE",
        "SNOWFLAKE_DATABASE",
        "SNOWFLAKE_SCHEMA",
        "SNOWFLAKE_ROLE",
    ]:
        monkeypatch.delenv(key, raising=False)


def test_get_snowflake_status_detects_default_profile(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    _clear_snowflake_env(monkeypatch)
    snowflake_home = tmp_path / "snowflake-home"
    snowflake_home.mkdir()
    (snowflake_home / "connections.toml").write_text(
        '[default]\n'
        'account = "demo-account"\n'
        'user = "demo-user"\n'
        'authenticator = "externalbrowser"\n'
        'database = "DEMO_DB"\n'
        'schema = "ANALYTICS"\n'
        'warehouse = "COMPUTE_WH"\n'
        'role = "SYSADMIN"\n',
        encoding="utf-8",
    )
    monkeypatch.setenv("SNOWFLAKE_HOME", str(snowflake_home))

    status = get_snowflake_status(probe=False)

    assert status.backend_supported is True
    assert status.configured is True
    assert status.connection.config_source == "connections.toml"
    assert status.connection.connection_name == "default"
    assert status.connection.account == "demo-account"
    assert status.probe.status == "not-run"


def test_validate_read_only_sql_strips_trailing_semicolon() -> None:
    assert validate_read_only_sql("select current_account();") == "select current_account()"


def test_validate_read_only_sql_rejects_write_operation() -> None:
    with pytest.raises(SnowflakeServiceError):
        validate_read_only_sql("with staged as (select 1) insert into audit_log select * from staged")


def test_snowflake_status_endpoint_returns_expected_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        main,
        "get_snowflake_status",
        lambda probe=False: SnowflakeStatusResponse(
            backend_supported=True,
            configured=True,
            message="Snowflake profile detected.",
            connection=SnowflakeConnectionInfo(
                config_source="connections.toml",
                connection_name="default",
                account="demo-account",
                user="demo-user",
                warehouse="COMPUTE_WH",
                database="DEMO_DB",
                schema="ANALYTICS",
                role="SYSADMIN",
                authenticator="externalbrowser",
                profile_path="/tmp/connections.toml",
            ),
            query_examples=["select 1"],
            probe=SnowflakeProbeResult(status="not-run"),
        ),
    )

    response = client.get("/api/snowflake/status?probe=true")

    assert response.status_code == 200
    body = response.json()
    assert body["configured"] is True
    assert body["connection"]["connection_name"] == "default"


def test_snowflake_query_endpoint_maps_service_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    def _raise_error(_payload):
        raise SnowflakeServiceError("Only read-only Snowflake queries are allowed.", status_code=400)

    monkeypatch.setattr(main, "run_snowflake_query", _raise_error)

    response = client.post("/api/snowflake/query", json={"sql": "delete from audit_log", "max_rows": 10})

    assert response.status_code == 400
    assert response.json()["detail"] == "Only read-only Snowflake queries are allowed."
