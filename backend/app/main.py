from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional

from fastapi import FastAPI
from fastapi import HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .agents import build_plan, preview_rollout_packet
from .data import (
    ADOPTION_METRICS,
    BUSINESS_CASE_METRICS,
    DELIVERY_METRICS,
    FEEDBACK_THEMES,
    FACILITATION_ITEMS,
    GUIDES,
    OBJECTION_LOG,
    POWER_BI_VIEWS,
    PROGRAM_SIGNALS,
    READINESS_DIMENSIONS,
    ROLE_FIT_CARDS,
    SAMPLE_REQUESTS,
    SUPPORT_CHANNELS,
    TRAINING_SESSIONS,
    USE_CASES,
)
from .models import GuideDetail, OverviewPayload, RolloutPacketPreviewRequest, SearchResponse, SearchResult
from .models import SnowflakeQueryRequest
from .snowflake_service import SnowflakeServiceError, get_snowflake_status, run_snowflake_query


app = FastAPI(
    title="Microsoft 365 Copilot Adoption Command Center API",
    version="0.1.0",
    description="Portfolio-safe command center for enterprise Copilot adoption, change management, and value realization.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _matches_query(texts: Iterable[str], query: Optional[str]) -> bool:
    if not query:
        return True
    lowered = query.lower()
    return any(lowered in text.lower() for text in texts)


def _overview_summary() -> dict:
    healthy_count = sum(1 for item in PROGRAM_SIGNALS if item.status == "healthy")
    readiness_score = int((healthy_count / len(PROGRAM_SIGNALS)) * 100)
    return {
        "use_case_count": len(USE_CASES),
        "guide_count": len(GUIDES),
        "healthy_signal_count": healthy_count,
        "readiness_score": readiness_score,
    }


def _load_guide_body(guide_id: str) -> GuideDetail:
    guide = next((item for item in GUIDES if item.id == guide_id), None)
    if guide is None:
        raise HTTPException(status_code=404, detail="guide not found")
    guide_path = PROJECT_ROOT / guide.path
    body = guide_path.read_text(encoding="utf-8")
    return GuideDetail(guide=guide, body=body)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "summary": _overview_summary()}


@app.get("/api/healthz")
def api_healthz() -> dict:
    return {"status": "ok", "summary": _overview_summary()}


@app.get("/api/use-cases")
def get_use_cases(
    q: Optional[str] = None,
    track: Optional[str] = Query(default=None),
    audience: Optional[str] = Query(default=None),
) -> dict:
    items = []
    for use_case in USE_CASES:
        if track and use_case.track != track:
            continue
        if audience and audience not in use_case.audiences and "all" not in use_case.audiences:
            continue
        if not _matches_query(
            [use_case.name, use_case.summary, use_case.workflow, " ".join(use_case.goals), " ".join(use_case.assets)],
            q,
        ):
            continue
        items.append(use_case.model_dump())
    return {"items": items}


@app.get("/api/tools")
def get_tools_alias(
    q: Optional[str] = None,
    track: Optional[str] = Query(default=None),
    audience: Optional[str] = Query(default=None),
) -> dict:
    return get_use_cases(q=q, track=track, audience=audience)


@app.get("/api/guides")
def get_guides(
    q: Optional[str] = None,
    audience: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
) -> dict:
    items = []
    for guide in GUIDES:
        if audience and guide.audience not in {audience, "all"}:
            continue
        if category and guide.category != category:
            continue
        if not _matches_query([guide.title, guide.summary, guide.excerpt, " ".join(guide.tags)], q):
            continue
        items.append(guide.model_dump())
    return {"items": items}


@app.get("/api/guides/{guide_id}")
def get_guide_detail(guide_id: str) -> dict:
    return _load_guide_body(guide_id).model_dump()


@app.get("/api/program-signals")
def get_program_signals() -> dict:
    return {"items": [signal.model_dump() for signal in PROGRAM_SIGNALS], "summary": _overview_summary()}


@app.get("/api/readiness")
def get_readiness() -> dict:
    return {"items": [item.model_dump() for item in READINESS_DIMENSIONS], "summary": _overview_summary()}


@app.get("/api/business-case")
def get_business_case() -> dict:
    return {"items": [item.model_dump() for item in BUSINESS_CASE_METRICS], "views": [item.model_dump() for item in POWER_BI_VIEWS]}


@app.get("/api/support-model")
def get_support_model() -> dict:
    return {
        "channels": [item.model_dump() for item in SUPPORT_CHANNELS],
        "feedback_themes": [item.model_dump() for item in FEEDBACK_THEMES],
    }


@app.get("/api/facilitation")
def get_facilitation() -> dict:
    return {
        "items": [item.model_dump() for item in FACILITATION_ITEMS],
        "objections": [item.model_dump() for item in OBJECTION_LOG],
    }


@app.get("/api/role-fit")
def get_role_fit() -> dict:
    return {"items": [card.model_dump() for card in ROLE_FIT_CARDS]}


@app.get("/api/interview/brief")
def get_runtime_brief() -> dict:
    return {
        "headline": "Portfolio-safe Microsoft 365 Copilot adoption simulation for readiness, change, analytics, and value realization.",
        "proof_points": [
            "Persona-based Copilot use case portfolio",
            "ADKAR-aligned readiness and training assets",
            "Power BI-style adoption and value metric framing",
            "Executive facilitation toolkit with decision log and parking lot",
            "Deterministic planner that turns objections into experiments",
        ],
        "interview_hooks": [
            "how to prioritize use cases instead of rolling out generic AI",
            "how to measure value beyond license activation",
            "how to handle quality, fear, and safety objections in workshops",
        ],
    }


@app.get("/api/snowflake/status")
def get_snowflake_connector_status(probe: bool = Query(default=False)) -> dict:
    return get_snowflake_status(probe=probe).model_dump(by_alias=True)


@app.post("/api/snowflake/query")
def post_snowflake_query(payload: SnowflakeQueryRequest) -> dict:
    try:
        return run_snowflake_query(payload).model_dump(by_alias=True)
    except SnowflakeServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc


@app.get("/api/search")
def search(q: str = Query(..., min_length=2)) -> SearchResponse:
    results = []
    for use_case in USE_CASES:
        if _matches_query(
            [use_case.name, use_case.summary, use_case.workflow, " ".join(use_case.goals), " ".join(use_case.assets)],
            q,
        ):
            results.append(
                SearchResult(
                    type="use-case",
                    id=use_case.id,
                    title=use_case.name,
                    summary=use_case.summary,
                    path="/api/use-cases",
                )
            )
    for guide in GUIDES:
        if _matches_query([guide.title, guide.summary, guide.excerpt, " ".join(guide.tags)], q):
            results.append(
                SearchResult(
                    type="guide",
                    id=guide.id,
                    title=guide.title,
                    summary=guide.summary,
                    path=guide.path,
                )
            )
    for index, card in enumerate(ROLE_FIT_CARDS, start=1):
        if _matches_query([card.requirement, card.proof, " ".join(card.artifacts)], q):
            results.append(
                SearchResult(
                    type="role-fit",
                    id=f"role-fit-{index}",
                    title=card.requirement,
                    summary=card.proof,
                    path="docs/role_fit.md",
                )
            )
    for index, item in enumerate(FACILITATION_ITEMS, start=1):
        if _matches_query([item.title, item.note, item.owner, item.status], q):
            results.append(
                SearchResult(
                    type="facilitation",
                    id=f"facilitation-{index}",
                    title=item.title,
                    summary=item.note,
                    path="/api/facilitation",
                )
            )
    return SearchResponse(query=q, total=len(results), items=[item.model_dump() for item in results]).model_dump()


@app.get("/api/overview")
def get_overview() -> dict:
    return OverviewPayload(
        summary=_overview_summary(),
        delivery_metrics=DELIVERY_METRICS,
        adoption_metrics=ADOPTION_METRICS,
        readiness_dimensions=READINESS_DIMENSIONS,
        business_case_metrics=BUSINESS_CASE_METRICS,
        power_bi_views=POWER_BI_VIEWS,
        support_channels=SUPPORT_CHANNELS,
        feedback_themes=FEEDBACK_THEMES,
        role_fit=ROLE_FIT_CARDS,
        sample_requests=SAMPLE_REQUESTS,
        use_cases=USE_CASES,
        guides=GUIDES,
        program_signals=PROGRAM_SIGNALS,
        training_sessions=TRAINING_SESSIONS,
        facilitation_items=FACILITATION_ITEMS,
        objection_log=OBJECTION_LOG,
    ).model_dump()


@app.post("/api/assistant/plan")
def post_plan(payload: dict) -> dict:
    from .models import PlanRequest

    request = PlanRequest(**payload)
    return build_plan(request).model_dump()


@app.post("/api/rollout-packet/preview")
def post_rollout_packet_preview(payload: RolloutPacketPreviewRequest) -> dict:
    return preview_rollout_packet(payload).model_dump()


@app.post("/api/guides/preview")
def post_guide_preview_alias(payload: RolloutPacketPreviewRequest) -> dict:
    return preview_rollout_packet(payload).model_dump()
