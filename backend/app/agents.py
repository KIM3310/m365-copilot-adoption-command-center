from __future__ import annotations

import re
from typing import Iterable, List, Tuple

from .data import GUIDES, OBJECTION_LOG, USE_CASES
from .models import (
    AgentStep,
    Citation,
    Experiment,
    PlanRequest,
    PlanResponse,
    RolloutPacketPreviewRequest,
    RolloutPacketPreviewResponse,
    UseCase,
)


STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "need",
    "needs",
    "want",
    "wants",
    "using",
    "copilot",
    "microsoft",
    "365",
    "program",
    "rollout",
    "enterprise",
    "their",
    "they",
}


def _tokenize(parts: Iterable[str]) -> List[str]:
    tokens: List[str] = []
    for part in parts:
        for token in re.findall(r"[a-zA-Z0-9\-]+", part.lower()):
            if token not in STOPWORDS:
                tokens.append(token)
    return tokens


def _detect_persona(request_text: str, audience: str) -> str:
    lowered = request_text.lower()
    if audience in {"finance", "legal", "customer-service", "executive"}:
        return audience
    if any(keyword in lowered for keyword in ["finance", "close", "cfo", "controller", "reconciliation", "variance", "excel"]):
        return "finance"
    if any(keyword in lowered for keyword in ["legal", "contract", "counsel", "clause", "matter", "compliance"]):
        return "legal"
    if any(
        keyword in lowered
        for keyword in ["customer service", "customer-service", "support", "case", "agent", "ticket", "resolution", "call center"]
    ):
        return "customer-service"
    if any(keyword in lowered for keyword in ["executive", "sponsor", "chief of staff", "decision log", "steering", "meeting recap"]):
        return "executive"
    if "champion" in lowered:
        return "champion"
    return "it"


def _select_use_case(persona: str) -> UseCase:
    preferred = {
        "finance": "finance-close-copilot-sprint",
        "legal": "legal-matter-prep-copilot-sprint",
        "customer-service": "customer-service-resolution-drafting-sprint",
        "executive": "executive-briefing-recap-sprint",
        "champion": "customer-service-resolution-drafting-sprint",
        "it": "finance-close-copilot-sprint",
    }[persona]
    return next(use_case for use_case in USE_CASES if use_case.id == preferred)


def _guide_score(request_text: str, title: str, summary: str, tags: List[str]) -> int:
    request_tokens = set(_tokenize([request_text]))
    guide_tokens = set(_tokenize([title, summary, " ".join(tags)]))
    return len(request_tokens & guide_tokens)


def _retrieve_citations(request_text: str, limit: int = 3) -> List[Citation]:
    ranked = sorted(
        GUIDES,
        key=lambda guide: _guide_score(request_text, guide.title, guide.summary, guide.tags),
        reverse=True,
    )
    selected = [guide for guide in ranked[:limit] if _guide_score(request_text, guide.title, guide.summary, guide.tags) > 0]
    if not selected:
        selected = ranked[:limit]
    return [
        Citation(
            guide_id=guide.id,
            title=guide.title,
            path=guide.path,
            reason=f"{guide.category} guidance that supports rollout readiness, enablement, or executive decision-making.",
        )
        for guide in selected
    ]


def _prioritized_use_cases(primary: UseCase) -> List[str]:
    related = [primary.name]
    if "finance" in primary.id:
        related.append("Executive Briefing and Decision Recap Sprint")
        related.append("Legal Matter Prep Copilot Sprint")
    elif "legal" in primary.id:
        related.append("Executive Briefing and Decision Recap Sprint")
        related.append("Finance Close Copilot Sprint")
    elif "customer-service" in primary.id:
        related.append("Champion Community Launch Kit")
        related.append("Executive Briefing and Decision Recap Sprint")
    else:
        related.append("Finance Close Copilot Sprint")
        related.append("Customer Service Resolution Drafting Sprint")
    return related


def _build_experiments(request_text: str, persona: str) -> List[Experiment]:
    lowered = request_text.lower()
    experiments: List[Experiment] = []

    if any(keyword in lowered for keyword in ["fear", "replace", "trust", "afraid", "resistance"]):
        experiments.append(OBJECTION_LOG[0])
    if any(keyword in lowered for keyword in ["quality", "accuracy", "hallucination", "wrong", "review"]):
        experiments.append(OBJECTION_LOG[1])
    if any(keyword in lowered for keyword in ["safety", "security", "compliance", "risk", "multilingual", "global", "geo"]):
        experiments.append(OBJECTION_LOG[2])

    if not experiments:
        default_map = {
            "finance": [OBJECTION_LOG[1], OBJECTION_LOG[0]],
            "legal": [OBJECTION_LOG[2], OBJECTION_LOG[1]],
            "customer-service": [OBJECTION_LOG[2], OBJECTION_LOG[0]],
            "executive": [OBJECTION_LOG[0]],
            "champion": [OBJECTION_LOG[0], OBJECTION_LOG[2]],
            "it": [OBJECTION_LOG[2], OBJECTION_LOG[0]],
        }
        experiments = default_map[persona]

    # Preserve order while removing duplicates by concern.
    seen: set[str] = set()
    deduped: List[Experiment] = []
    for experiment in experiments:
        if experiment.concern in seen:
            continue
        seen.add(experiment.concern)
        deduped.append(experiment)
    return deduped


def build_plan(request: PlanRequest) -> PlanResponse:
    persona = _detect_persona(request.request, request.audience)
    primary = _select_use_case(persona)
    citations = _retrieve_citations(request.request)
    experiments = _build_experiments(request.request, persona)

    confidence_pct = {
        "finance": 93,
        "legal": 91,
        "customer-service": 92,
        "executive": 90,
        "champion": 88,
        "it": 87,
    }[persona]

    readiness_actions = [
        "Score sponsor awareness, manager desire, and practitioner ability using the readiness playbook before confirming the next wave.",
        "Baseline the current workflow time, quality checks, and support volume so value claims have a before-and-after comparison.",
        "Clarify approved data sources, review gates, and escalation paths before broad communication starts.",
    ]
    if persona in {"legal", "finance"}:
        readiness_actions.append("Run a manager-reviewed sample set to prove safe usage patterns in regulated work before scale-out.")
    if "global" in request.request.lower() or "multilingual" in request.request.lower():
        readiness_actions.append("Attach local-language FAQs and regional office-hour coverage before launch communications go live.")

    training_actions = [
        "Run a persona-specific prompt lab with concrete before-and-after examples rather than generic AI awareness training.",
        "Activate champions with one escalation route, one office-hour rhythm, and one shared FAQ backlog.",
        "Teach managers how to coach on draft quality and when to require human approval.",
    ]
    if persona == "customer-service":
        training_actions.append("Use supervisor calibration sessions to align tone, fact-checking, and multilingual response expectations.")
    if persona == "executive":
        training_actions.append("Equip the chief-of-staff team with timer, parking lot, and decision-log templates for every steering session.")

    business_case_actions = [
        "Define one sponsor-owned business problem, one baseline metric, and one target KPI before the pilot starts.",
        "Frame the case in business language such as cycle-time reduction, quality lift, or faster follow-through instead of tool usage alone.",
        "Plan a 30-day and 90-day value review so the scale decision has a documented operating rhythm.",
    ]
    communications_actions = [
        "Prepare a manager cascade with simple language on why Copilot is changing, what is in scope, and how to get help.",
        "Localize launch communications, FAQs, and examples for each geo before expanding the wave.",
        "Publish a short internal communications pack that reinforces safe-use boundaries and success stories.",
    ]
    support_actions = [
        "Route first-line questions through champions and capture recurring issues in a weekly support digest.",
        "Define support SLAs for prompt-quality issues, access questions, and escalation to security or compliance owners.",
        "Review unresolved blockers in every steering meeting and close them with named owners and dates.",
    ]
    feedback_actions = [
        "Collect feedback from surveys, office hours, ticket themes, and champion digests instead of relying on anecdotal reactions.",
        "Tag issues by prompt quality, policy clarity, access, and local-language needs so the response plan is specific.",
        "Turn the top feedback themes into weekly backlog items owned by adoption, support, or platform leads.",
    ]
    facilitation_actions = [
        "Run steering sessions with a visible timer, a parking lot, and a live decision log.",
        "Summarize every meeting in owner-date-next-step format before the room closes.",
        "Escalate unresolved objections as experiments, not debates, so momentum stays visible.",
    ]

    value_actions = [
        "Track weekly active use, repeat use, quality approval, and support reopen rate in a Power BI-style sponsor view.",
        "Run a 30-day value readout comparing baseline time, post-training behavior, and business-owner validation.",
        "Decide whether to scale, refine, or stop the wave based on KPI thresholds rather than enthusiasm alone.",
    ]

    risks = [
        "Do not scale based on seat activation alone; require repeat usage and manager-validated quality signals.",
        "Keep Copilot positioned as a drafting accelerator, not an autonomous decision-maker, especially in regulated workflows.",
        "If the support model is unclear, adoption will stall even when training attendance looks strong.",
    ]
    if persona == "legal":
        risks.append("Legal pilots fail quickly when people confuse clause comparison support with final legal judgment.")
    if persona == "customer-service":
        risks.append("Multilingual inconsistency will erode trust unless local examples and calibration are built into training.")

    exec_summary = (
        f"Start with the `{primary.name}` program, run a 30-day pilot with baseline metrics, "
        "convert objections into owner-led experiments, and take a scale decision only after repeat usage and quality approval hold."
    )

    agent_trace = [
        AgentStep(agent="persona-agent", decision=persona, detail=f"Mapped the request to the `{persona}` persona and operating context."),
        AgentStep(
            agent="value-agent",
            decision=primary.track,
            detail=f"Selected the `{primary.track}` track because it best fits the requested business outcome.",
        ),
        AgentStep(
            agent="objection-agent",
            decision=f"{len(experiments)} experiments",
            detail="Converted fear, quality, or safety objections into measurable experiments with owners and dates.",
        ),
        AgentStep(
            agent="readout-agent",
            decision="exec-ready plan",
            detail="Structured the plan so an executive sponsor can review readiness, training, support, and value together.",
        ),
    ]

    return PlanResponse(
        recommended_program=primary.name,
        recommended_track=primary.track,
        confidence_pct=confidence_pct,
        owner_team=primary.owner,
        exec_summary=exec_summary,
        rollout_phases=[
            "baseline the workflow and confirm sponsor goals",
            "run readiness assessment and safe-use review",
            "launch champion-led training and targeted communications",
            "measure adoption, quality, and support signals weekly",
            "hold a scale decision with the value readout and decision log",
        ],
        prioritized_use_cases=_prioritized_use_cases(primary),
        business_case_actions=business_case_actions,
        readiness_actions=readiness_actions,
        training_actions=training_actions,
        communications_actions=communications_actions,
        support_actions=support_actions,
        feedback_actions=feedback_actions,
        facilitation_actions=facilitation_actions,
        value_actions=value_actions,
        risks=risks,
        experiments=experiments,
        citations=citations,
        agent_trace=agent_trace,
    )


def preview_rollout_packet(payload: RolloutPacketPreviewRequest) -> RolloutPacketPreviewResponse:
    lowered = payload.body.lower()
    warnings: List[str] = []

    required_signals = {
        "owner": "Owner is missing from the packet.",
        "scope": "Scope is missing from the packet.",
        "baseline": "Baseline metric is missing from the packet.",
        "kpi": "Success KPI is missing from the packet.",
        "business case": "Business case statement is missing from the packet.",
        "training": "Training plan is missing from the packet.",
        "communications": "Communications plan is missing from the packet.",
        "support": "Support or escalation route is missing from the packet.",
        "champion": "Champion model is missing from the packet.",
        "decision log": "Decision log follow-through is missing from the packet.",
        "geo": "Geo or rollout wave is missing from the packet.",
        "language": "Language or localization plan is missing from the packet.",
    }
    for signal, message in required_signals.items():
        if signal not in lowered:
            warnings.append(message)

    channels = {
        "executive": ["steering committee packet", "manager cascade note", "executive summary page"],
        "it": ["implementation stand-up", "service owner channel", "project site"],
        "finance": ["finance leadership sync", "close week toolkit", "office hours follow-up"],
        "legal": ["legal leadership review", "practice group page", "matter intake FAQ"],
        "customer-service": ["supervisor huddle", "agent learning hub", "regional office hours"],
        "champion": ["champion community hub", "monthly digest", "Q&A channel"],
        "all": ["project site", "manager cascade", "FAQ page"],
    }
    reviewers = {
        "executive": ["Executive Sponsor", "Change Lead", "Adoption Analytics Lead"],
        "it": ["M365 Platform Lead", "Security Reviewer", "Change Lead"],
        "finance": ["Finance Controller", "Change Lead", "Champion Manager"],
        "legal": ["General Counsel Delegate", "Compliance Lead", "Change Lead"],
        "customer-service": ["Service Director", "Regional Champion Manager", "Helpdesk Lead"],
        "champion": ["Champion Community Manager", "Change Lead", "Helpdesk Lead"],
        "all": ["Change Lead", "Security Reviewer", "Communications Lead"],
    }
    checklist = [
        "State the business problem and who owns the decision.",
        "Include a baseline, target KPI, and review cadence.",
        "Describe the support path and champion model.",
        "Specify the rollout wave, geo scope, and language plan.",
        "Call out what Copilot can do, cannot do, and when human review is required.",
    ]
    talking_points = [
        "What pain point are we removing for this persona in the next 30 days?",
        "What will tell us the pilot is working beyond license activation?",
        "What objection are we converting into an experiment with an owner and date?",
    ]
    normalized_title = " ".join(word.capitalize() for word in payload.title.split())
    readiness_score = max(0, 100 - len(warnings) * 12)

    return RolloutPacketPreviewResponse(
        normalized_title=normalized_title,
        ready_for_exec_review=len(warnings) == 0,
        readiness_score=readiness_score,
        distribution_channels=channels[payload.audience],
        checklist=checklist,
        reviewers=reviewers[payload.audience],
        warnings=warnings,
        talking_points=talking_points,
    )
