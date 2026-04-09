import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const overviewPayload = {
  summary: {
    use_case_count: 4,
    guide_count: 6,
    healthy_signal_count: 3,
    readiness_score: 60,
  },
  delivery_metrics: [
    { label: 'Priority personas', value: '4', detail: 'persona detail' },
    { label: 'Wave countries', value: '12', detail: 'country detail' },
  ],
  adoption_metrics: [
    { label: 'Time saved per active user', value: '38 min/week', trend: '+9 min', detail: 'metric detail' },
  ],
  readiness_dimensions: [
    { name: 'Awareness', score_pct: 88, owner: 'Executive Sponsor', status: 'healthy', action: 'repeat sponsor message' },
  ],
  business_case_metrics: [
    { label: 'Finance recap package cycle time', baseline: '52 min', target: '32 min', owner: 'Finance Controller', value_case: 'shorten recap effort' },
  ],
  power_bi_views: [
    { name: 'Sponsor scorecard', audience: 'executive', purpose: 'weekly steering view', primary_kpis: ['weekly active use'] },
  ],
  support_channels: [
    { name: 'Champion office hours', tier: 'tier-1', owner: 'Champion Community Manager', sla: 'Same business day', purpose: 'resolve routine questions', languages: ['English', 'Korean'] },
  ],
  feedback_themes: [
    { theme: 'Managers need stronger quality coaching examples', source: 'Survey', volume: 'High', owner: 'Training Lead', next_action: 'publish examples' },
  ],
  role_fit: [
    {
      requirement: 'Copilot readiness assessments and action plans',
      proof: 'direct proof',
      artifacts: ['artifact-a', 'artifact-b'],
    },
  ],
  sample_requests: ['sample sponsor request'],
  use_cases: [
    {
      id: 'finance-close-copilot-sprint',
      name: 'Finance Close Copilot Sprint',
      track: 'value-realization',
      audiences: ['finance', 'executive', 'it'],
      summary: 'finance summary',
      workflow: 'Copilot in Excel, Teams, and Outlook',
      stakeholders: ['Finance Controller'],
      owner: 'Copilot Adoption Office',
      rollout_wave: 'Wave 1',
      goals: ['goal one'],
      guardrails: ['guardrail one'],
      assets: ['asset one'],
      adoption_stage: 'pilot-ready',
    },
  ],
  guides: [
    {
      id: 'guide-001',
      title: 'Copilot Readiness Assessment Playbook',
      audience: 'it',
      category: 'assessment',
      summary: 'guide summary',
      tags: ['ADKAR'],
      path: 'docs/copilot_readiness_assessment.md',
      excerpt: 'guide excerpt',
      owner: 'Copilot Adoption Office',
      distribution: ['project site'],
      last_updated: '2026-04-09',
    },
  ],
  program_signals: [
    {
      name: 'Weekly active usage in wave 1',
      status: 'healthy',
      metric: '61%',
      owner: 'Adoption Analytics Lead',
      detail: 'healthy details',
    },
  ],
  training_sessions: [
    {
      title: 'Executive Sponsor Copilot Briefing',
      audience: 'executive',
      format: '30-minute decision briefing',
      owner: 'Copilot Adoption Office',
      outcome: 'align sponsors',
    },
  ],
  facilitation_items: [
    {
      title: 'Approve wave 2 customer service launch language',
      kind: 'decision',
      owner: 'Regional Change Lead',
      due_date: '2026-04-18',
      status: 'needs sponsor decision',
      note: 'decision note',
    },
  ],
  objection_log: [
    {
      concern: 'AI fear',
      hypothesis: 'show reviewed examples',
      owner: 'Change Enablement Lead',
      target_date: '2026-04-24',
      success_metric: 'repeat usage up 5 points',
    },
  ],
};

const guideDetailPayload = {
  guide: overviewPayload.guides[0],
  body: '# Copilot Readiness Assessment Playbook\n\nGuide body preview',
};

const planPayload = {
  recommended_program: 'Finance Close Copilot Sprint',
  recommended_track: 'value-realization',
  confidence_pct: 93,
  owner_team: 'Copilot Adoption Office',
  exec_summary: 'Start with a 30-day finance pilot.',
  rollout_phases: ['baseline the workflow'],
  prioritized_use_cases: ['Finance Close Copilot Sprint'],
  business_case_actions: ['Define the sponsor-owned business problem'],
  readiness_actions: ['Score readiness'],
  training_actions: ['Run a finance prompt lab'],
  communications_actions: ['Prepare a manager cascade'],
  support_actions: ['Route first-line questions through champions'],
  feedback_actions: ['Collect feedback from surveys and office hours'],
  facilitation_actions: ['Run steering sessions with a visible timer'],
  value_actions: ['Track weekly active use'],
  risks: ['Do not scale on seat activation alone'],
  experiments: [
    {
      concern: 'Quality concern',
      hypothesis: 'Use templates',
      owner: 'Finance Controller',
      target_date: '2026-04-19',
      success_metric: 'Approval stays above 85 percent',
    },
  ],
  citations: [
    {
      guide_id: 'guide-001',
      title: 'Copilot Readiness Assessment Playbook',
      path: 'docs/copilot_readiness_assessment.md',
      reason: 'relevant guidance',
    },
  ],
  agent_trace: [
    { agent: 'persona-agent', decision: 'finance', detail: 'mapped the request to finance' },
  ],
};

const packetPreviewPayload = {
  normalized_title: 'Finance Wave 1 Packet',
  ready_for_exec_review: true,
  readiness_score: 100,
  distribution_channels: ['finance leadership sync'],
  checklist: ['State the business problem'],
  reviewers: ['Finance Controller'],
  warnings: [],
  talking_points: ['What pain point are we removing?'],
};

const snowflakeStatusPayload = {
  backend_supported: true,
  configured: true,
  message:
    'Detected Snowflake connection profile `default` from `/Users/dolphin/.snowflake/connections.toml`. Run a probe to validate the current browser or SSO session.',
  connection: {
    config_source: 'connections.toml',
    connection_name: 'default',
    account: 'kp57591.ap-northeast-2.aws',
    user: 'EHDJS0836',
    warehouse: 'COMPUTE_WH',
    database: 'DISTRICTPILOT_AI',
    schema: 'ANALYTICS',
    role: 'ACCOUNTADMIN',
    authenticator: 'externalbrowser',
    profile_path: '/Users/dolphin/.snowflake/connections.toml',
  },
  query_examples: [
    'select current_account() as account',
    'show schemas',
  ],
  probe: {
    status: 'not-run',
    account: null,
    user: null,
    warehouse: null,
    database: null,
    schema: null,
    query_id: null,
    error: null,
  },
};

const snowflakeQueryPayload = {
  ok: true,
  executed_sql: 'select current_account() as account',
  query_id: '01a-query',
  columns: ['ACCOUNT'],
  rows: [{ ACCOUNT: 'KP57591' }],
  row_count: 1,
  truncated: false,
  duration_ms: 82,
  connection: snowflakeStatusPayload.connection,
};

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/overview')) {
        return Promise.resolve(new Response(JSON.stringify(overviewPayload), { status: 200 }));
      }
      if (url.includes('/api/snowflake/status')) {
        return Promise.resolve(new Response(JSON.stringify(snowflakeStatusPayload), { status: 200 }));
      }
      if (url.includes('/api/guides/guide-001')) {
        return Promise.resolve(new Response(JSON.stringify(guideDetailPayload), { status: 200 }));
      }
      if (url.includes('/api/snowflake/query') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify(snowflakeQueryPayload), { status: 200 }));
      }
      if (url.includes('/api/assistant/plan') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify(planPayload), { status: 200 }));
      }
      if (url.includes('/api/rollout-packet/preview') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify(packetPreviewPayload), { status: 200 }));
      }
      if (url.includes('/api/search')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              query: 'champion',
              total: 1,
              items: [
                {
                  type: 'guide',
                  id: 'guide-001',
                  title: 'Copilot Readiness Assessment Playbook',
                  summary: 'guide summary',
                  path: 'docs/copilot_readiness_assessment.md',
                },
              ],
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('renders overview content and guide detail', async () => {
    render(<App />);

    await screen.findByRole('heading', { name: 'Microsoft 365 Copilot Adoption Command Center' });
    await screen.findByText('Finance Close Copilot Sprint');
    await screen.findByText('ADKAR-style readiness scorecard');
    await screen.findByText('Feedback and support operating model');
    await screen.findByText('Snowflake connector status');
    await screen.findByText('kp57591.ap-northeast-2.aws');
    await screen.findAllByText('Copilot Readiness Assessment Playbook');
    await screen.findByText((content) => content.includes('Guide body preview'));
  });

  it('runs planner and rollout packet preview flows', async () => {
    render(<App />);

    const plannerButton = await screen.findByRole('button', { name: 'Build Copilot plan' });
    fireEvent.click(plannerButton);

    await screen.findByText('93% confidence');
    await waitFor(() => {
      expect(screen.getAllByText('Copilot Adoption Office').length).toBeGreaterThan(0);
    });

    const previewButton = screen.getByRole('button', { name: 'Preview rollout packet' });
    fireEvent.click(previewButton);

    await screen.findByText('exec-ready');
    await screen.findByText('100/100');
  });

  it('can search assets', async () => {
    render(<App />);

    const searchButton = await screen.findByRole('button', { name: 'Search assets' });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('1 matches')).toBeInTheDocument();
    });
  });

  it('can run a Snowflake preview query', async () => {
    render(<App />);

    const queryButton = await screen.findByRole('button', { name: 'Run Snowflake preview query' });
    fireEvent.click(queryButton);

    await screen.findByText('Last Snowflake result');
    await screen.findByText((content) => content.includes('01a-query'));
    await screen.findByText('KP57591');
  });
});
