export type Audience =
  | 'all'
  | 'executive'
  | 'it'
  | 'finance'
  | 'legal'
  | 'customer-service'
  | 'champion';

export type ProgramTrack =
  | 'change-readiness'
  | 'use-case-design'
  | 'training-and-champions'
  | 'adoption-analytics'
  | 'value-realization';

export type StatusTone = 'healthy' | 'watch' | 'risk';
export type SearchResultType = 'use-case' | 'guide' | 'role-fit' | 'facilitation';

export interface UseCase {
  id: string;
  name: string;
  track: ProgramTrack;
  audiences: Audience[];
  summary: string;
  workflow: string;
  stakeholders: string[];
  owner: string;
  rollout_wave: string;
  goals: string[];
  guardrails: string[];
  assets: string[];
  adoption_stage: string;
}

export interface Guide {
  id: string;
  title: string;
  audience: Audience;
  category: string;
  summary: string;
  tags: string[];
  path: string;
  excerpt: string;
  owner: string;
  distribution: string[];
  last_updated: string;
}

export interface ProgramSignal {
  name: string;
  status: StatusTone;
  metric: string;
  owner: string;
  detail: string;
}

export interface TrainingSession {
  title: string;
  audience: Audience;
  format: string;
  owner: string;
  outcome: string;
}

export interface ReadinessDimension {
  name: string;
  score_pct: number;
  owner: string;
  status: StatusTone;
  action: string;
}

export interface BusinessCaseMetric {
  label: string;
  baseline: string;
  target: string;
  owner: string;
  value_case: string;
}

export interface PowerBIView {
  name: string;
  audience: Audience;
  purpose: string;
  primary_kpis: string[];
}

export interface SupportChannel {
  name: string;
  tier: 'tier-0' | 'tier-1' | 'tier-2' | 'tier-3';
  owner: string;
  sla: string;
  purpose: string;
  languages: string[];
}

export interface FeedbackTheme {
  theme: string;
  source: string;
  volume: string;
  owner: string;
  next_action: string;
}

export interface DeliveryMetric {
  label: string;
  value: string;
  detail: string;
}

export interface AdoptionMetric {
  label: string;
  value: string;
  trend: string;
  detail: string;
}

export interface RoleFitCard {
  requirement: string;
  proof: string;
  artifacts: string[];
}

export interface FacilitationItem {
  title: string;
  kind: 'decision' | 'parking-lot' | 'timer' | 'readout';
  owner: string;
  due_date: string;
  status: string;
  note: string;
}

export interface Experiment {
  concern: string;
  hypothesis: string;
  owner: string;
  target_date: string;
  success_metric: string;
}

export interface OverviewSummary {
  use_case_count: number;
  guide_count: number;
  healthy_signal_count: number;
  readiness_score: number;
}

export interface GuideDetail {
  guide: Guide;
  body: string;
}

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  summary: string;
  path: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  items: SearchResult[];
}

export interface Citation {
  guide_id: string;
  title: string;
  path: string;
  reason: string;
}

export interface AgentStep {
  agent: string;
  decision: string;
  detail: string;
}

export interface PlanResponse {
  recommended_program: string;
  recommended_track: ProgramTrack;
  confidence_pct: number;
  owner_team: string;
  exec_summary: string;
  rollout_phases: string[];
  prioritized_use_cases: string[];
  business_case_actions: string[];
  readiness_actions: string[];
  training_actions: string[];
  communications_actions: string[];
  support_actions: string[];
  feedback_actions: string[];
  facilitation_actions: string[];
  value_actions: string[];
  risks: string[];
  experiments: Experiment[];
  citations: Citation[];
  agent_trace: AgentStep[];
}

export interface RolloutPacketPreviewResponse {
  normalized_title: string;
  ready_for_exec_review: boolean;
  readiness_score: number;
  distribution_channels: string[];
  checklist: string[];
  reviewers: string[];
  warnings: string[];
  talking_points: string[];
}

export interface OverviewPayload {
  summary: OverviewSummary;
  delivery_metrics: DeliveryMetric[];
  adoption_metrics: AdoptionMetric[];
  readiness_dimensions: ReadinessDimension[];
  business_case_metrics: BusinessCaseMetric[];
  power_bi_views: PowerBIView[];
  support_channels: SupportChannel[];
  feedback_themes: FeedbackTheme[];
  role_fit: RoleFitCard[];
  sample_requests: string[];
  use_cases: UseCase[];
  guides: Guide[];
  program_signals: ProgramSignal[];
  training_sessions: TrainingSession[];
  facilitation_items: FacilitationItem[];
  objection_log: Experiment[];
}
