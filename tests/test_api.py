from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_alias_returns_ok() -> None:
    response = client.get("/api/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["summary"]["use_case_count"] >= 4


def test_overview_returns_core_sections() -> None:
    response = client.get("/api/overview")
    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["use_case_count"] >= 4
    assert len(body["delivery_metrics"]) >= 3
    assert len(body["adoption_metrics"]) >= 3
    assert len(body["readiness_dimensions"]) >= 4
    assert len(body["business_case_metrics"]) >= 3
    assert len(body["power_bi_views"]) >= 2
    assert len(body["support_channels"]) >= 3
    assert len(body["feedback_themes"]) >= 3
    assert len(body["role_fit"]) >= 4
    assert len(body["sample_requests"]) >= 3
    assert len(body["use_cases"]) >= 4
    assert len(body["guides"]) >= 5
    assert len(body["program_signals"]) >= 4
    assert len(body["training_sessions"]) >= 4
    assert len(body["facilitation_items"]) >= 3
    assert len(body["objection_log"]) >= 2


def test_use_cases_endpoint_supports_filtering() -> None:
    response = client.get("/api/use-cases?audience=finance&q=finance")
    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == "finance-close-copilot-sprint"


def test_guide_detail_returns_markdown_body() -> None:
    response = client.get("/api/guides/guide-001")
    assert response.status_code == 200
    body = response.json()
    assert body["guide"]["id"] == "guide-001"
    assert "Copilot Readiness Assessment Playbook" in body["body"]


def test_search_returns_cross_surface_matches() -> None:
    response = client.get("/api/search?q=decision")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 2
    assert {item["type"] for item in body["items"]} & {"guide", "facilitation"}


def test_support_model_endpoint_returns_channels_and_feedback() -> None:
    response = client.get("/api/support-model")
    assert response.status_code == 200
    body = response.json()
    assert len(body["channels"]) >= 3
    assert len(body["feedback_themes"]) >= 3


def test_business_case_endpoint_returns_metrics_and_views() -> None:
    response = client.get("/api/business-case")
    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) >= 3
    assert len(body["views"]) >= 2


def test_plan_prefers_finance_program_for_finance_sponsor_request() -> None:
    response = client.post(
        "/api/assistant/plan",
        json={
            "request": (
                "Our CFO wants a 30-day Copilot plan for finance close with readiness, "
                "champions, and clear KPI tracking."
            ),
            "audience": "finance",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["recommended_program"] == "Finance Close Copilot Sprint"
    assert body["recommended_track"] == "value-realization"
    assert body["confidence_pct"] >= 85
    assert len(body["prioritized_use_cases"]) >= 2
    assert len(body["business_case_actions"]) >= 2
    assert len(body["readiness_actions"]) >= 3
    assert len(body["communications_actions"]) >= 2
    assert len(body["feedback_actions"]) >= 2
    assert len(body["facilitation_actions"]) >= 2
    assert len(body["value_actions"]) >= 2
    assert len(body["experiments"]) >= 1
    assert len(body["agent_trace"]) == 4


def test_rollout_packet_preview_warns_when_required_sections_missing() -> None:
    response = client.post(
        "/api/rollout-packet/preview",
        json={
            "title": "customer service packet",
            "audience": "customer-service",
            "purpose": "Prepare the launch packet",
            "body": "This packet describes the pilot, but it is still missing details on support and metrics.",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["normalized_title"] == "Customer Service Packet"
    assert body["ready_for_exec_review"] is False
    assert body["readiness_score"] < 100
    assert len(body["warnings"]) >= 3


def test_rollout_packet_preview_can_be_exec_ready() -> None:
    response = client.post(
        "/api/rollout-packet/preview",
        json={
            "title": "finance wave 1 packet",
            "audience": "finance",
            "purpose": "Prepare the executive review packet",
            "body": (
                "Owner: Copilot Adoption Office\n"
                "Scope: Finance month-end close pilot\n"
                "Baseline: 52 minutes per recap package\n"
                "Business Case: Reduce close-week recap effort while keeping quality stable\n"
                "KPI: Repeat usage above 75 percent\n"
                "Training: finance prompt lab plus manager coaching kit\n"
                "Communications: manager cascade and localized FAQ pack\n"
                "Support: finance office hours and helpdesk\n"
                "Champion: 18 finance champions\n"
                "Decision Log: weekly steering review\n"
                "Geo: Korea, Singapore, United Kingdom\n"
                "Language: English and Korean launch pack\n"
            ),
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ready_for_exec_review"] is True
    assert body["readiness_score"] == 100
    assert len(body["talking_points"]) >= 2
