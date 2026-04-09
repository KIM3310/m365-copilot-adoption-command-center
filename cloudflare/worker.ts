import { guideDetails, overview } from './generated/static-data';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response> | Response;
  };
}

type Audience = 'all' | 'executive' | 'it' | 'finance' | 'legal' | 'customer-service' | 'champion';

type ValidationIssue = {
  type: string;
  loc: string[];
  msg: string;
  input: unknown;
  ctx?: Record<string, unknown>;
};

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'need',
  'needs',
  'want',
  'wants',
  'using',
  'copilot',
  'microsoft',
  '365',
  'program',
  'rollout',
  'enterprise',
  'their',
  'they',
]);

const AUDIENCES: Audience[] = ['all', 'executive', 'it', 'finance', 'legal', 'customer-service', 'champion'];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function validationResponse(issues: ValidationIssue[], status = 422): Response {
  return jsonResponse({ detail: issues }, status);
}

function expectedAudienceText(): string {
  return AUDIENCES.map((value) => `'${value}'`).join(', ');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

async function parseJsonBody(request: Request): Promise<{ payload?: Record<string, unknown>; error?: Response }> {
  try {
    const raw = (await request.json()) as unknown;
    const payload = asRecord(raw);
    if (!payload) {
      return {
        error: validationResponse([
          {
            type: 'model_attributes_type',
            loc: ['body'],
            msg: 'Input should be a valid dictionary or object to extract fields from',
            input: raw,
          },
        ]),
      };
    }
    return { payload };
  } catch {
    return {
      error: validationResponse([
        {
          type: 'json_invalid',
          loc: ['body', 'json'],
          msg: 'JSON decode error',
          input: null,
        },
      ]),
    };
  }
}

function validateRequiredString(
  payload: Record<string, unknown>,
  field: string,
  minLength: number,
  locPrefix: 'body' | 'query',
): ValidationIssue[] {
  const value = payload[field];
  const loc = [locPrefix, field];
  if (value === undefined) {
    return [{ type: 'missing', loc, msg: 'Field required', input: payload }];
  }
  if (typeof value !== 'string') {
    return [{ type: 'string_type', loc, msg: 'Input should be a valid string', input: value }];
  }
  if (value.length < minLength) {
    return [
      {
        type: 'string_too_short',
        loc,
        msg: `String should have at least ${minLength} characters`,
        input: value,
        ctx: { min_length: minLength },
      },
    ];
  }
  return [];
}

function validateOptionalAudience(
  payload: Record<string, unknown>,
  field: string,
  defaultValue: Audience,
): { value: Audience; issues: ValidationIssue[] } {
  const value = payload[field];
  if (value === undefined) {
    return { value: defaultValue, issues: [] };
  }
  if (typeof value !== 'string' || !AUDIENCES.includes(value as Audience)) {
    return {
      value: defaultValue,
      issues: [
        {
          type: 'literal_error',
          loc: ['body', field],
          msg: `Input should be ${expectedAudienceText()}`,
          input: value,
          ctx: { expected: expectedAudienceText() },
        },
      ],
    };
  }
  return { value: value as Audience, issues: [] };
}

function validateRequiredAudience(payload: Record<string, unknown>, field: string): { value?: Audience; issues: ValidationIssue[] } {
  const value = payload[field];
  if (value === undefined) {
    return {
      issues: [{ type: 'missing', loc: ['body', field], msg: 'Field required', input: payload }],
    };
  }
  if (typeof value !== 'string' || !AUDIENCES.includes(value as Audience)) {
    return {
      issues: [
        {
          type: 'literal_error',
          loc: ['body', field],
          msg: `Input should be ${expectedAudienceText()}`,
          input: value,
          ctx: { expected: expectedAudienceText() },
        },
      ],
    };
  }
  return { value: value as Audience, issues: [] };
}

function matchesQuery(texts: string[], query: string | null): boolean {
  if (!query) {
    return true;
  }
  const lowered = query.toLowerCase();
  return texts.some((text) => text.toLowerCase().includes(lowered));
}

function tokenize(parts: string[]): string[] {
  return parts.flatMap((part) =>
    Array.from(part.toLowerCase().matchAll(/[a-z0-9-]+/g))
      .map((match) => match[0])
      .filter((token) => !STOPWORDS.has(token)),
  );
}

function detectPersona(requestText: string, audience: string): string {
  const lowered = requestText.toLowerCase();
  if (['finance', 'legal', 'customer-service', 'executive'].includes(audience)) {
    return audience;
  }
  if (['finance', 'close', 'cfo', 'controller', 'reconciliation', 'variance', 'excel'].some((value) => lowered.includes(value))) {
    return 'finance';
  }
  if (['legal', 'contract', 'counsel', 'clause', 'matter', 'compliance'].some((value) => lowered.includes(value))) {
    return 'legal';
  }
  if (['customer service', 'customer-service', 'support', 'case', 'agent', 'ticket', 'resolution', 'call center'].some((value) => lowered.includes(value))) {
    return 'customer-service';
  }
  if (['executive', 'sponsor', 'chief of staff', 'decision log', 'steering', 'meeting recap'].some((value) => lowered.includes(value))) {
    return 'executive';
  }
  if (lowered.includes('champion')) {
    return 'champion';
  }
  return 'it';
}

function selectUseCase(persona: string) {
  const preferred: Record<string, string> = {
    finance: 'finance-close-copilot-sprint',
    legal: 'legal-matter-prep-copilot-sprint',
    'customer-service': 'customer-service-resolution-drafting-sprint',
    executive: 'executive-briefing-recap-sprint',
    champion: 'customer-service-resolution-drafting-sprint',
    it: 'finance-close-copilot-sprint',
  };
  return overview.use_cases.find((item) => item.id === preferred[persona]) ?? overview.use_cases[0];
}

function guideScore(requestText: string, title: string, summary: string, tags: readonly string[]): number {
  const requestTokens = new Set(tokenize([requestText]));
  const guideTokens = new Set(tokenize([title, summary, tags.join(' ')]));
  return Array.from(requestTokens).filter((token) => guideTokens.has(token)).length;
}

function retrieveCitations(requestText: string) {
  const ranked = [...overview.guides].sort(
    (a, b) => guideScore(requestText, b.title, b.summary, b.tags) - guideScore(requestText, a.title, a.summary, a.tags),
  );
  const selected = ranked.filter((guide) => guideScore(requestText, guide.title, guide.summary, guide.tags) > 0).slice(0, 3);
  const chosen = selected.length > 0 ? selected : ranked.slice(0, 3);
  return chosen.map((guide) => ({
    guide_id: guide.id,
    title: guide.title,
    path: guide.path,
    reason: `${guide.category} guidance that supports rollout readiness, enablement, or executive decision-making.`,
  }));
}

function prioritizedUseCases(primary: (typeof overview.use_cases)[number]): string[] {
  const related: string[] = [primary.name];
  if (primary.id.includes('finance')) {
    related.push('Executive Briefing and Decision Recap Sprint', 'Legal Matter Prep Copilot Sprint');
  } else if (primary.id.includes('legal')) {
    related.push('Executive Briefing and Decision Recap Sprint', 'Finance Close Copilot Sprint');
  } else if (primary.id.includes('customer-service')) {
    related.push('Champion Community Launch Kit', 'Executive Briefing and Decision Recap Sprint');
  } else {
    related.push('Finance Close Copilot Sprint', 'Customer Service Resolution Drafting Sprint');
  }
  return related;
}

function buildExperiments(requestText: string, persona: string) {
  const lowered = requestText.toLowerCase();
  const experiments: Array<(typeof overview.objection_log)[number]> = [];

  if (['fear', 'replace', 'trust', 'afraid', 'resistance'].some((value) => lowered.includes(value))) {
    experiments.push(overview.objection_log[0]);
  }
  if (['quality', 'accuracy', 'hallucination', 'wrong', 'review'].some((value) => lowered.includes(value))) {
    experiments.push(overview.objection_log[1]);
  }
  if (['safety', 'security', 'compliance', 'risk', 'multilingual', 'global', 'geo'].some((value) => lowered.includes(value))) {
    experiments.push(overview.objection_log[2]);
  }

  if (experiments.length === 0) {
    const defaults: Record<string, Array<(typeof overview.objection_log)[number]>> = {
      finance: [overview.objection_log[1], overview.objection_log[0]],
      legal: [overview.objection_log[2], overview.objection_log[1]],
      'customer-service': [overview.objection_log[2], overview.objection_log[0]],
      executive: [overview.objection_log[0]],
      champion: [overview.objection_log[0], overview.objection_log[2]],
      it: [overview.objection_log[2], overview.objection_log[0]],
    };
    experiments.push(...defaults[persona]);
  }

  const seen = new Set<string>();
  return experiments.filter((item) => {
    if (seen.has(item.concern)) {
      return false;
    }
    seen.add(item.concern);
    return true;
  });
}

function buildPlan(payload: { request: string; audience: string }) {
  const persona = detectPersona(payload.request, payload.audience);
  const primary = selectUseCase(persona);
  const citations = retrieveCitations(payload.request);
  const experiments = buildExperiments(payload.request, persona);

  const confidencePct: Record<string, number> = {
    finance: 93,
    legal: 91,
    'customer-service': 92,
    executive: 90,
    champion: 88,
    it: 87,
  };

  const readinessActions = [
    'Score sponsor awareness, manager desire, and practitioner ability using the readiness playbook before confirming the next wave.',
    'Baseline the current workflow time, quality checks, and support volume so value claims have a before-and-after comparison.',
    'Clarify approved data sources, review gates, and escalation paths before broad communication starts.',
  ];
  if (persona === 'legal' || persona === 'finance') {
    readinessActions.push('Run a manager-reviewed sample set to prove safe usage patterns in regulated work before scale-out.');
  }
  if (payload.request.toLowerCase().includes('global') || payload.request.toLowerCase().includes('multilingual')) {
    readinessActions.push('Attach local-language FAQs and regional office-hour coverage before launch communications go live.');
  }

  const trainingActions = [
    'Run a persona-specific prompt lab with concrete before-and-after examples rather than generic AI awareness training.',
    'Activate champions with one escalation route, one office-hour rhythm, and one shared FAQ backlog.',
    'Teach managers how to coach on draft quality and when to require human approval.',
  ];
  if (persona === 'customer-service') {
    trainingActions.push('Use supervisor calibration sessions to align tone, fact-checking, and multilingual response expectations.');
  }
  if (persona === 'executive') {
    trainingActions.push('Equip the chief-of-staff team with timer, parking lot, and decision-log templates for every steering session.');
  }

  return {
    recommended_program: primary.name,
    recommended_track: primary.track,
    confidence_pct: confidencePct[persona],
    owner_team: primary.owner,
    exec_summary: `Start with the \`${primary.name}\` program, run a 30-day pilot with baseline metrics, convert objections into owner-led experiments, and take a scale decision only after repeat usage and quality approval hold.`,
    rollout_phases: [
      'baseline the workflow and confirm sponsor goals',
      'run readiness assessment and safe-use review',
      'launch champion-led training and targeted communications',
      'measure adoption, quality, and support signals weekly',
      'hold a scale decision with the value readout and decision log',
    ],
    prioritized_use_cases: prioritizedUseCases(primary),
    business_case_actions: [
      'Define one sponsor-owned business problem, one baseline metric, and one target KPI before the pilot starts.',
      'Frame the case in business language such as cycle-time reduction, quality lift, or faster follow-through instead of tool usage alone.',
      'Plan a 30-day and 90-day value review so the scale decision has a documented operating rhythm.',
    ],
    readiness_actions: readinessActions,
    training_actions: trainingActions,
    communications_actions: [
      'Prepare a manager cascade with simple language on why Copilot is changing, what is in scope, and how to get help.',
      'Localize launch communications, FAQs, and examples for each geo before expanding the wave.',
      'Publish a short internal communications pack that reinforces safe-use boundaries and success stories.',
    ],
    support_actions: [
      'Route first-line questions through champions and capture recurring issues in a weekly support digest.',
      'Define support SLAs for prompt-quality issues, access questions, and escalation to security or compliance owners.',
      'Review unresolved blockers in every steering meeting and close them with named owners and dates.',
    ],
    feedback_actions: [
      'Collect feedback from surveys, office hours, ticket themes, and champion digests instead of relying on anecdotal reactions.',
      'Tag issues by prompt quality, policy clarity, access, and local-language needs so the response plan is specific.',
      'Turn the top feedback themes into weekly backlog items owned by adoption, support, or platform leads.',
    ],
    facilitation_actions: [
      'Run steering sessions with a visible timer, a parking lot, and a live decision log.',
      'Summarize every meeting in owner-date-next-step format before the room closes.',
      'Escalate unresolved objections as experiments, not debates, so momentum stays visible.',
    ],
    value_actions: [
      'Track weekly active use, repeat use, quality approval, and support reopen rate in a Power BI-style sponsor view.',
      'Run a 30-day value readout comparing baseline time, post-training behavior, and business-owner validation.',
      'Decide whether to scale, refine, or stop the wave based on KPI thresholds rather than enthusiasm alone.',
    ],
    risks: [
      'Do not scale based on seat activation alone; require repeat usage and manager-validated quality signals.',
      'Keep Copilot positioned as a drafting accelerator, not an autonomous decision-maker, especially in regulated workflows.',
      'If the support model is unclear, adoption will stall even when training attendance looks strong.',
      ...(persona === 'legal' ? ['Legal pilots fail quickly when people confuse clause comparison support with final legal judgment.'] : []),
      ...(persona === 'customer-service'
        ? ['Multilingual inconsistency will erode trust unless local examples and calibration are built into training.']
        : []),
    ],
    experiments,
    citations,
    agent_trace: [
      { agent: 'persona-agent', decision: persona, detail: `Mapped the request to the \`${persona}\` persona and operating context.` },
      { agent: 'value-agent', decision: primary.track, detail: `Selected the \`${primary.track}\` track because it best fits the requested business outcome.` },
      { agent: 'objection-agent', decision: `${experiments.length} experiments`, detail: 'Converted fear, quality, or safety objections into measurable experiments with owners and dates.' },
      { agent: 'readout-agent', decision: 'exec-ready plan', detail: 'Structured the plan so an executive sponsor can review readiness, training, support, and value together.' },
    ],
  };
}

function previewRolloutPacket(payload: { title: string; audience: Audience; body: string }) {
  const lowered = payload.body.toLowerCase();
  const warnings: string[] = [];
  const requiredSignals: Record<string, string> = {
    owner: 'Owner is missing from the packet.',
    scope: 'Scope is missing from the packet.',
    baseline: 'Baseline metric is missing from the packet.',
    kpi: 'Success KPI is missing from the packet.',
    'business case': 'Business case statement is missing from the packet.',
    training: 'Training plan is missing from the packet.',
    communications: 'Communications plan is missing from the packet.',
    support: 'Support or escalation route is missing from the packet.',
    champion: 'Champion model is missing from the packet.',
    'decision log': 'Decision log follow-through is missing from the packet.',
    geo: 'Geo or rollout wave is missing from the packet.',
    language: 'Language or localization plan is missing from the packet.',
  };

  for (const [signal, message] of Object.entries(requiredSignals)) {
    if (!lowered.includes(signal)) {
      warnings.push(message);
    }
  }

  const channels: Record<string, string[]> = {
    executive: ['steering committee packet', 'manager cascade note', 'executive summary page'],
    it: ['implementation stand-up', 'service owner channel', 'project site'],
    finance: ['finance leadership sync', 'close week toolkit', 'office hours follow-up'],
    legal: ['legal leadership review', 'practice group page', 'matter intake FAQ'],
    'customer-service': ['supervisor huddle', 'agent learning hub', 'regional office hours'],
    champion: ['champion community hub', 'monthly digest', 'Q&A channel'],
    all: ['project site', 'manager cascade', 'FAQ page'],
  };
  const reviewers: Record<string, string[]> = {
    executive: ['Executive Sponsor', 'Change Lead', 'Adoption Analytics Lead'],
    it: ['M365 Platform Lead', 'Security Reviewer', 'Change Lead'],
    finance: ['Finance Controller', 'Change Lead', 'Champion Manager'],
    legal: ['General Counsel Delegate', 'Compliance Lead', 'Change Lead'],
    'customer-service': ['Service Director', 'Regional Champion Manager', 'Helpdesk Lead'],
    champion: ['Champion Community Manager', 'Change Lead', 'Helpdesk Lead'],
    all: ['Change Lead', 'Security Reviewer', 'Communications Lead'],
  };

  return {
    normalized_title: payload.title
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    ready_for_exec_review: warnings.length === 0,
    readiness_score: Math.max(0, 100 - warnings.length * 12),
    distribution_channels: channels[payload.audience] ?? channels.all,
    checklist: [
      'State the business problem and who owns the decision.',
      'Include a baseline, target KPI, and review cadence.',
      'Describe the support path and champion model.',
      'Specify the rollout wave, geo scope, and language plan.',
      'Call out what Copilot can do, cannot do, and when human review is required.',
    ],
    reviewers: reviewers[payload.audience] ?? reviewers.all,
    warnings,
    talking_points: [
      'What pain point are we removing for this persona in the next 30 days?',
      'What will tell us the pilot is working beyond license activation?',
      'What objection are we converting into an experiment with an owner and date?',
    ],
  };
}

function snowflakeStatusStub() {
  return {
    backend_supported: false,
    configured: false,
    message:
      'Snowflake direct connectivity is implemented in the Python backend. The Cloudflare Worker deployment exposes a stub status only.',
    connection: {
      config_source: 'cloudflare-worker',
      connection_name: null,
      account: null,
      user: null,
      warehouse: null,
      database: null,
      schema: null,
      role: null,
      authenticator: null,
      profile_path: null,
    },
    query_examples: [
      'select current_account() as account, current_user() as username, current_warehouse() as warehouse, current_database() as database_name, current_schema() as schema_name',
      'select table_catalog, table_schema, table_name from information_schema.tables order by table_schema, table_name limit 10',
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
}

async function handleApi(request: Request, url: URL): Promise<Response | null> {
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  if ((pathname === '/healthz' || pathname === '/api/healthz') && method === 'GET') {
    return jsonResponse({ status: 'ok', summary: overview.summary });
  }
  if (pathname === '/api/overview' && method === 'GET') {
    return jsonResponse(overview);
  }
  if ((pathname === '/api/use-cases' || pathname === '/api/tools') && method === 'GET') {
    const q = url.searchParams.get('q');
    const track = url.searchParams.get('track') ?? url.searchParams.get('lane');
    const audience = url.searchParams.get('audience');
    const items = overview.use_cases.filter((item) => {
      if (track && item.track !== track) return false;
      if (audience && !item.audiences.includes(audience as never) && !item.audiences.includes('all' as never)) return false;
      return matchesQuery([item.name, item.summary, item.workflow, item.goals.join(' '), item.assets.join(' ')], q);
    });
    return jsonResponse({ items });
  }
  if (pathname === '/api/guides' && method === 'GET') {
    const q = url.searchParams.get('q');
    const audience = url.searchParams.get('audience');
    const category = url.searchParams.get('category');
    const items = overview.guides.filter((item) => {
      if (audience && item.audience !== audience && item.audience !== 'all') return false;
      if (category && item.category !== category) return false;
      return matchesQuery([item.title, item.summary, item.excerpt, item.tags.join(' ')], q);
    });
    return jsonResponse({ items });
  }
  if (pathname.startsWith('/api/guides/') && method === 'GET') {
    const guideId = pathname.split('/').pop() as string;
    const detail = guideDetails[guideId as keyof typeof guideDetails];
    return detail ? jsonResponse(detail) : jsonResponse({ detail: 'guide not found' }, 404);
  }
  if (pathname === '/api/program-signals' && method === 'GET') {
    return jsonResponse({ items: overview.program_signals, summary: overview.summary });
  }
  if (pathname === '/api/readiness' && method === 'GET') {
    return jsonResponse({ items: overview.readiness_dimensions, summary: overview.summary });
  }
  if (pathname === '/api/business-case' && method === 'GET') {
    return jsonResponse({ items: overview.business_case_metrics, views: overview.power_bi_views });
  }
  if (pathname === '/api/support-model' && method === 'GET') {
    return jsonResponse({ channels: overview.support_channels, feedback_themes: overview.feedback_themes });
  }
  if (pathname === '/api/facilitation' && method === 'GET') {
    return jsonResponse({ items: overview.facilitation_items, objections: overview.objection_log });
  }
  if (pathname === '/api/role-fit' && method === 'GET') {
    return jsonResponse({ items: overview.role_fit });
  }
  if (pathname === '/api/interview/brief' && method === 'GET') {
    return jsonResponse({
      headline: 'Portfolio-safe Microsoft 365 Copilot adoption simulation for readiness, change, analytics, and value realization.',
      proof_points: [
        'Persona-based Copilot use case portfolio',
        'ADKAR-aligned readiness and training assets',
        'Power BI-style adoption and value metric framing',
        'Executive facilitation toolkit with decision log and parking lot',
        'Deterministic planner that turns objections into experiments',
      ],
      interview_hooks: [
        'how to prioritize use cases instead of rolling out generic AI',
        'how to measure value beyond license activation',
        'how to handle quality, fear, and safety objections in workshops',
      ],
    });
  }
  if (pathname === '/api/snowflake/status' && method === 'GET') {
    return jsonResponse(snowflakeStatusStub());
  }
  if (pathname === '/api/snowflake/query' && method === 'POST') {
    return jsonResponse(
      {
        detail:
          'Snowflake query execution is available in the Python backend only. Run the local FastAPI service to execute live Snowflake queries.',
      },
      501,
    );
  }
  if (pathname === '/api/search' && method === 'GET') {
    const q = url.searchParams.get('q');
    if (q === null) {
      return validationResponse([{ type: 'missing', loc: ['query', 'q'], msg: 'Field required', input: null }]);
    }
    if (q.length < 2) {
      return validationResponse([
        {
          type: 'string_too_short',
          loc: ['query', 'q'],
          msg: 'String should have at least 2 characters',
          input: q,
          ctx: { min_length: 2 },
        },
      ]);
    }
    const items = [
      ...overview.use_cases
        .filter((item) => matchesQuery([item.name, item.summary, item.workflow, item.goals.join(' '), item.assets.join(' ')], q))
        .map((item) => ({ type: 'use-case', id: item.id, title: item.name, summary: item.summary, path: '/api/use-cases' })),
      ...overview.guides
        .filter((item) => matchesQuery([item.title, item.summary, item.excerpt, item.tags.join(' ')], q))
        .map((item) => ({ type: 'guide', id: item.id, title: item.title, summary: item.summary, path: item.path })),
      ...overview.role_fit
        .filter((item) => matchesQuery([item.requirement, item.proof, item.artifacts.join(' ')], q))
        .map((item, index) => ({ type: 'role-fit', id: `role-fit-${index + 1}`, title: item.requirement, summary: item.proof, path: 'docs/role_fit.md' })),
      ...overview.facilitation_items
        .filter((item) => matchesQuery([item.title, item.note, item.owner, item.status], q))
        .map((item, index) => ({ type: 'facilitation', id: `facilitation-${index + 1}`, title: item.title, summary: item.note, path: '/api/facilitation' })),
    ];
    return jsonResponse({ query: q, total: items.length, items });
  }
  if (pathname === '/api/assistant/plan' && method === 'POST') {
    const parsed = await parseJsonBody(request);
    if (parsed.error) {
      return parsed.error;
    }
    const payload = parsed.payload as Record<string, unknown>;
    const issues = [...validateRequiredString(payload, 'request', 8, 'body')];
    const audienceResult = validateOptionalAudience(payload, 'audience', 'it');
    issues.push(...audienceResult.issues);
    if (issues.length > 0) {
      return validationResponse(issues);
    }
    return jsonResponse(
      buildPlan({
        request: payload.request as string,
        audience: audienceResult.value,
      }),
    );
  }
  if ((pathname === '/api/rollout-packet/preview' || pathname === '/api/guides/preview') && method === 'POST') {
    const parsed = await parseJsonBody(request);
    if (parsed.error) {
      return parsed.error;
    }
    const payload = parsed.payload as Record<string, unknown>;
    const issues = [
      ...validateRequiredString(payload, 'title', 3, 'body'),
      ...validateRequiredString(payload, 'purpose', 8, 'body'),
      ...validateRequiredString(payload, 'body', 20, 'body'),
    ];
    const audienceResult = validateRequiredAudience(payload, 'audience');
    issues.push(...audienceResult.issues);
    if (issues.length > 0) {
      return validationResponse(issues);
    }
    return jsonResponse(
      previewRolloutPacket({
        title: payload.title as string,
        audience: audienceResult.value as Audience,
        body: payload.body as string,
      }),
    );
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const apiResponse = await handleApi(request, url);
    if (apiResponse) {
      return apiResponse;
    }
    return env.ASSETS.fetch(request);
  },
};

export { handleApi };
