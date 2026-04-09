from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, Field


ProgramTrack = Literal[
    "change-readiness",
    "use-case-design",
    "training-and-champions",
    "adoption-analytics",
    "value-realization",
]
Audience = Literal["all", "executive", "it", "finance", "legal", "customer-service", "champion"]
StatusTone = Literal["healthy", "watch", "risk"]
FacilitationType = Literal["decision", "parking-lot", "timer", "readout"]
SupportTier = Literal["tier-0", "tier-1", "tier-2", "tier-3"]


class UseCase(BaseModel):
    id: str
    name: str
    track: ProgramTrack
    audiences: List[Audience]
    summary: str
    workflow: str
    stakeholders: List[str]
    owner: str
    rollout_wave: str
    goals: List[str]
    guardrails: List[str]
    assets: List[str]
    adoption_stage: str


class Guide(BaseModel):
    id: str
    title: str
    audience: Audience
    category: str
    summary: str
    tags: List[str]
    path: str
    excerpt: str
    owner: str
    distribution: List[str]
    last_updated: str


class ProgramSignal(BaseModel):
    name: str
    status: StatusTone
    metric: str
    owner: str
    detail: str


class TrainingSession(BaseModel):
    title: str
    audience: Audience
    format: str
    owner: str
    outcome: str


class ReadinessDimension(BaseModel):
    name: str
    score_pct: int
    owner: str
    status: StatusTone
    action: str


class BusinessCaseMetric(BaseModel):
    label: str
    baseline: str
    target: str
    owner: str
    value_case: str


class PowerBIView(BaseModel):
    name: str
    audience: Audience
    purpose: str
    primary_kpis: List[str]


class SupportChannel(BaseModel):
    name: str
    tier: SupportTier
    owner: str
    sla: str
    purpose: str
    languages: List[str]


class FeedbackTheme(BaseModel):
    theme: str
    source: str
    volume: str
    owner: str
    next_action: str


class DeliveryMetric(BaseModel):
    label: str
    value: str
    detail: str


class AdoptionMetric(BaseModel):
    label: str
    value: str
    trend: str
    detail: str


class RoleFitCard(BaseModel):
    requirement: str
    proof: str
    artifacts: List[str]


class FacilitationItem(BaseModel):
    title: str
    kind: FacilitationType
    owner: str
    due_date: str
    status: str
    note: str


class Experiment(BaseModel):
    concern: str
    hypothesis: str
    owner: str
    target_date: str
    success_metric: str


class OverviewSummary(BaseModel):
    use_case_count: int
    guide_count: int
    healthy_signal_count: int
    readiness_score: int


class GuideDetail(BaseModel):
    guide: Guide
    body: str


class SearchResult(BaseModel):
    type: Literal["use-case", "guide", "role-fit", "facilitation"]
    id: str
    title: str
    summary: str
    path: str


class SearchResponse(BaseModel):
    query: str
    total: int
    items: List[SearchResult]


class Citation(BaseModel):
    guide_id: str
    title: str
    path: str
    reason: str


class AgentStep(BaseModel):
    agent: str
    decision: str
    detail: str


class PlanRequest(BaseModel):
    request: str = Field(..., min_length=8)
    audience: Audience = "it"


class PlanResponse(BaseModel):
    recommended_program: str
    recommended_track: ProgramTrack
    confidence_pct: int
    owner_team: str
    exec_summary: str
    rollout_phases: List[str]
    prioritized_use_cases: List[str]
    business_case_actions: List[str]
    readiness_actions: List[str]
    training_actions: List[str]
    communications_actions: List[str]
    support_actions: List[str]
    feedback_actions: List[str]
    facilitation_actions: List[str]
    value_actions: List[str]
    risks: List[str]
    experiments: List[Experiment]
    citations: List[Citation]
    agent_trace: List[AgentStep]


class RolloutPacketPreviewRequest(BaseModel):
    title: str = Field(..., min_length=3)
    audience: Audience
    purpose: str = Field(..., min_length=8)
    body: str = Field(..., min_length=20)


class RolloutPacketPreviewResponse(BaseModel):
    normalized_title: str
    ready_for_exec_review: bool
    readiness_score: int
    distribution_channels: List[str]
    checklist: List[str]
    reviewers: List[str]
    warnings: List[str]
    talking_points: List[str]


class OverviewPayload(BaseModel):
    summary: OverviewSummary
    delivery_metrics: List[DeliveryMetric]
    adoption_metrics: List[AdoptionMetric]
    readiness_dimensions: List[ReadinessDimension]
    business_case_metrics: List[BusinessCaseMetric]
    power_bi_views: List[PowerBIView]
    support_channels: List[SupportChannel]
    feedback_themes: List[FeedbackTheme]
    role_fit: List[RoleFitCard]
    sample_requests: List[str]
    use_cases: List[UseCase]
    guides: List[Guide]
    program_signals: List[ProgramSignal]
    training_sessions: List[TrainingSession]
    facilitation_items: List[FacilitationItem]
    objection_log: List[Experiment]
