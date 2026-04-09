import { FormEvent, startTransition, useDeferredValue, useEffect, useState } from 'react';
import type {
  Audience,
  GuideDetail,
  OverviewPayload,
  PlanResponse,
  RolloutPacketPreviewResponse,
  SearchResponse,
  SnowflakeQueryResponse,
  SnowflakeStatusResponse,
  StatusTone,
} from './types';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://127.0.0.1:8000');

const audienceOptions: Array<{ value: Audience; label: string }> = [
  { value: 'it', label: 'IT / Platform' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'customer-service', label: 'Customer Service' },
  { value: 'executive', label: 'Executive Sponsor' },
  { value: 'champion', label: 'Champion Lead' },
];

function includesQuery(parts: string[], query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  const lowered = query.toLowerCase();
  return parts.some((part) => part.toLowerCase().includes(lowered));
}

function toneClass(status: StatusTone): string {
  return {
    healthy: 'tone-healthy',
    watch: 'tone-watch',
    risk: 'tone-risk',
  }[status];
}

function renderCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function App() {
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requestText, setRequestText] = useState(
    'Our executive sponsor wants a 30-day Microsoft 365 Copilot business case for finance and legal with readiness, champions, and value KPIs.',
  );
  const [audience, setAudience] = useState<Audience>('finance');
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [planning, setPlanning] = useState(false);

  const [useCaseQuery, setUseCaseQuery] = useState('');
  const [guideQuery, setGuideQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('champion');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);

  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [guideDetail, setGuideDetail] = useState<GuideDetail | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  const [packetTitle, setPacketTitle] = useState('Finance Copilot Wave 1 Packet');
  const [packetAudience, setPacketAudience] = useState<Audience>('finance');
  const [packetPurpose, setPacketPurpose] = useState('Prepare the executive review packet for a finance-focused Copilot wave.');
  const [packetBody, setPacketBody] = useState(
    [
      'Owner: Copilot Adoption Office',
      'Scope: Finance month-end close pilot',
      'Baseline: 52 minutes per recap package',
      'Business Case: Reduce close-week recap effort while keeping manager-approved quality',
      'KPI: Repeat usage above 75 percent with manager quality approval above 82 percent',
      'Training: finance prompt lab plus manager coaching kit',
      'Communications: manager cascade and localized FAQ pack',
      'Support: champion office hours and helpdesk escalation',
      'Champion: 18 finance champions across three regions',
      'Decision Log: weekly steering review with owner-date-next-step tracking',
      'Geo: Korea, Singapore, United Kingdom',
      'Language: English and Korean launch pack',
    ].join('\n'),
  );
  const [packetPreview, setPacketPreview] = useState<RolloutPacketPreviewResponse | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const [snowflakeStatus, setSnowflakeStatus] = useState<SnowflakeStatusResponse | null>(null);
  const [snowflakeLoading, setSnowflakeLoading] = useState(true);
  const [snowflakeSql, setSnowflakeSql] = useState(
    'select current_account() as account, current_user() as username, current_warehouse() as warehouse, current_database() as database_name, current_schema() as schema_name',
  );
  const [snowflakeQuery, setSnowflakeQuery] = useState<SnowflakeQueryResponse | null>(null);
  const [snowflakeQuerying, setSnowflakeQuerying] = useState(false);
  const [snowflakeProbing, setSnowflakeProbing] = useState(false);

  const deferredUseCaseQuery = useDeferredValue(useCaseQuery);
  const deferredGuideQuery = useDeferredValue(guideQuery);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/overview`);
        if (!response.ok) {
          throw new Error('overview fetch failed');
        }
        const payload: OverviewPayload = await response.json();
        startTransition(() => {
          setOverview(payload);
          setSelectedGuideId((current) => current ?? payload.guides[0]?.id ?? null);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to load overview');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/snowflake/status`);
        if (!response.ok) {
          throw new Error('snowflake status fetch failed');
        }
        const payload: SnowflakeStatusResponse = await response.json();
        startTransition(() => setSnowflakeStatus(payload));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to load snowflake status');
      } finally {
        setSnowflakeLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!selectedGuideId) {
      return;
    }

    const run = async () => {
      setGuideLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/guides/${selectedGuideId}`);
        if (!response.ok) {
          throw new Error('guide detail fetch failed');
        }
        const payload: GuideDetail = await response.json();
        startTransition(() => setGuideDetail(payload));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'failed to load guide');
      } finally {
        setGuideLoading(false);
      }
    };
    void run();
  }, [selectedGuideId]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/search?${new URLSearchParams({ q: searchQuery }).toString()}`);
      if (!response.ok) {
        throw new Error('search request failed');
      }
      const payload: SearchResponse = await response.json();
      startTransition(() => setSearchResults(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'search failed');
    } finally {
      setSearching(false);
    }
  };

  const handlePlan = async (event: FormEvent) => {
    event.preventDefault();
    setPlanning(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/assistant/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: requestText, audience }),
      });
      if (!response.ok) {
        throw new Error('planner request failed');
      }
      const payload: PlanResponse = await response.json();
      startTransition(() => setPlan(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'planner failed');
    } finally {
      setPlanning(false);
    }
  };

  const handlePacketPreview = async (event: FormEvent) => {
    event.preventDefault();
    setPreviewing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/rollout-packet/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: packetTitle,
          audience: packetAudience,
          purpose: packetPurpose,
          body: packetBody,
        }),
      });
      if (!response.ok) {
        throw new Error('packet preview request failed');
      }
      const payload: RolloutPacketPreviewResponse = await response.json();
      startTransition(() => setPacketPreview(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'packet preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSnowflakeProbe = async () => {
    setSnowflakeProbing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/snowflake/status?probe=true`);
      if (!response.ok) {
        throw new Error('snowflake probe failed');
      }
      const payload: SnowflakeStatusResponse = await response.json();
      startTransition(() => setSnowflakeStatus(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'snowflake probe failed');
    } finally {
      setSnowflakeProbing(false);
    }
  };

  const handleSnowflakeQuery = async (event: FormEvent) => {
    event.preventDefault();
    setSnowflakeQuerying(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/snowflake/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: snowflakeSql, max_rows: 25 }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { detail?: string };
        throw new Error(body.detail ?? 'snowflake query failed');
      }
      const payload: SnowflakeQueryResponse = await response.json();
      startTransition(() => setSnowflakeQuery(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'snowflake query failed');
    } finally {
      setSnowflakeQuerying(false);
    }
  };

  const filteredUseCases = overview?.use_cases.filter((useCase) =>
    includesQuery(
      [
        useCase.name,
        useCase.summary,
        useCase.workflow,
        useCase.rollout_wave,
        useCase.goals.join(' '),
        useCase.assets.join(' '),
      ],
      deferredUseCaseQuery,
    ),
  );

  const filteredGuides = overview?.guides.filter((guide) =>
    includesQuery([guide.title, guide.summary, guide.excerpt, guide.tags.join(' ')], deferredGuideQuery),
  );

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Portfolio-Safe Interview Project</span>
          <h1>Microsoft 365 Copilot Adoption Command Center</h1>
          <p className="hero-text">
            This project is a synthetic enterprise program simulation built for the AI Adoption
            Architect / Consultant role. It shows how I would assess readiness, prioritize Copilot
            use cases, activate champions, measure value, and facilitate executive decisions with a
            clear decision log.
          </p>

          <div className="hero-actions">
            <button type="button" onClick={() => setRequestText(overview?.sample_requests[0] ?? requestText)}>
              Load sponsor scenario
            </button>
            <button type="button" className="ghost" onClick={() => setSearchQuery('decision log')}>
              Search decision assets
            </button>
          </div>

          {overview && (
            <div className="hero-strip">
              <div className="hero-chip">
                <span>Use Cases</span>
                <strong>{overview.summary.use_case_count}</strong>
              </div>
              <div className="hero-chip">
                <span>Guides</span>
                <strong>{overview.summary.guide_count}</strong>
              </div>
              <div className="hero-chip">
                <span>Readiness</span>
                <strong>{overview.summary.readiness_score}%</strong>
              </div>
            </div>
          )}
        </div>

        <aside className="hero-panel">
          {overview ? (
            <>
              <div className="stat-card stat-feature">
                <span className="stat-label">Readiness score</span>
                <strong>{overview.summary.readiness_score}%</strong>
                <p>Balanced mix of healthy and watch signals to keep the case realistic and discussion-ready.</p>
              </div>
              {overview.delivery_metrics.map((metric) => (
                <div className="stat-card" key={metric.label}>
                  <span className="stat-label">{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.detail}</p>
                </div>
              ))}
            </>
          ) : (
            <div className="stat-card">
              <strong>Loading overview...</strong>
            </div>
          )}
        </aside>
      </header>

      {loading && <div className="notice">Loading project overview...</div>}
      {error && <div className="notice notice-error">{error}</div>}

      {overview && (
        <>
          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Role Match</span>
                <h2>Why this fits the Microsoft role</h2>
              </div>
              <div className="stack">
                {overview.role_fit.map((item) => (
                  <article className="card" key={item.requirement}>
                    <div className="card-topline">
                      <span className="pill">direct match</span>
                      <span className="muted">{item.artifacts.join(' · ')}</span>
                    </div>
                    <h3>{item.requirement}</h3>
                    <p>{item.proof}</p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Search</span>
                <h2>Fast review path</h2>
              </div>
              <article className="card">
                <ol className="flat-list numbered">
                  <li>Review the role-fit cards and readiness score.</li>
                  <li>Open a persona use case and inspect the guardrails.</li>
                  <li>Run the Copilot scenario planner with one business prompt.</li>
                  <li>Check the facilitation board and objection experiments.</li>
                  <li>Preview the rollout packet before executive review.</li>
                </ol>
              </article>

              <form className="search-form card" onSubmit={handleSearch}>
                <label className="field">
                  <span>Asset search</span>
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search for champions, KPI, decision log..." />
                </label>
                <button type="submit">{searching ? 'Searching...' : 'Search assets'}</button>
                {searchResults && (
                  <div className="search-results">
                    <strong>{searchResults.total} matches</strong>
                    <ul className="flat-list">
                      {searchResults.items.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                          <span className="mini-chip">{item.type}</span>
                          <span className="search-title">{item.title}</span>
                          <span className="muted">{item.summary}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <span className="eyebrow">Use Cases</span>
              <h2>Persona-based Copilot portfolio</h2>
            </div>

            <div className="toolbar">
              <label className="field field-inline">
                <span>Filter use cases</span>
                <input value={useCaseQuery} onChange={(event) => setUseCaseQuery(event.target.value)} placeholder="finance, legal, multilingual, executive..." />
              </label>
            </div>

            <div className="grid cards-2">
              {filteredUseCases?.map((useCase) => (
                <article className="card use-case-card" key={useCase.id}>
                  <div className="card-topline">
                    <span className="pill">{useCase.track}</span>
                    <span className="muted">{useCase.rollout_wave}</span>
                  </div>
                  <h3>{useCase.name}</h3>
                  <p>{useCase.summary}</p>
                  <p className="workflow">{useCase.workflow}</p>

                  <div className="chip-row">
                    {useCase.audiences.map((item) => (
                      <span className="mini-chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="split-list">
                    <div>
                      <h4>Goals</h4>
                      <ul className="flat-list">
                        {useCase.goals.map((goal) => (
                          <li key={goal}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Guardrails</h4>
                      <ul className="flat-list">
                        {useCase.guardrails.map((guardrail) => (
                          <li key={guardrail}>{guardrail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="meta-row">
                    <span>
                      <strong>Owner:</strong> {useCase.owner}
                    </span>
                    <span>
                      <strong>Stage:</strong> {useCase.adoption_stage}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Readiness</span>
                <h2>ADKAR-style readiness scorecard</h2>
              </div>
              <div className="stack">
                {overview.readiness_dimensions.map((item) => (
                  <article className="card" key={item.name}>
                    <div className="card-topline">
                      <span className={`signal-pill ${toneClass(item.status)}`}>{item.status}</span>
                      <span className="muted">{item.owner}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <strong className="metric-value">{item.score_pct}%</strong>
                    <p>{item.action}</p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Business Case</span>
                <h2>Sponsor value narrative</h2>
              </div>
              <div className="stack">
                {overview.business_case_metrics.map((item) => (
                  <article className="card" key={item.label}>
                    <div className="card-topline">
                      <span className="pill-good">
                        {item.baseline} to {item.target}
                      </span>
                      <span className="muted">{item.owner}</span>
                    </div>
                    <h3>{item.label}</h3>
                    <p>{item.value_case}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Value</span>
                <h2>Adoption and value metrics</h2>
              </div>
              <div className="stack">
                {overview.adoption_metrics.map((metric) => (
                  <article className="card metric-card" key={metric.label}>
                    <div className="card-topline">
                      <span className="pill-good">{metric.trend}</span>
                    </div>
                    <h3>{metric.label}</h3>
                    <strong className="metric-value">{metric.value}</strong>
                    <p>{metric.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Signals</span>
                <h2>Program health at a glance</h2>
              </div>
              <div className="stack">
                {overview.program_signals.map((signal) => (
                  <article className="card signal-card" key={signal.name}>
                    <div className="card-topline">
                      <span className={`signal-pill ${toneClass(signal.status)}`}>{signal.status}</span>
                      <span className="muted">{signal.owner}</span>
                    </div>
                    <h3>{signal.name}</h3>
                    <strong className="metric-value">{signal.metric}</strong>
                    <p>{signal.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Training</span>
                <h2>Champions and learning plan</h2>
              </div>
              <div className="stack">
                {overview.training_sessions.map((session) => (
                  <article className="card" key={session.title}>
                    <div className="card-topline">
                      <span className="mini-chip">{session.audience}</span>
                      <span className="muted">{session.owner}</span>
                    </div>
                    <h3>{session.title}</h3>
                    <p className="workflow">{session.format}</p>
                    <p>{session.outcome}</p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Support</span>
                <h2>Feedback and support operating model</h2>
              </div>
              <div className="stack">
                {overview.support_channels.map((item) => (
                  <article className="card" key={item.name}>
                    <div className="card-topline">
                      <span className="pill">{item.tier}</span>
                      <span className="muted">{item.sla}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.purpose}</p>
                    <p className="muted">
                      <strong>{item.owner}</strong> · {item.languages.join(', ')}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Telemetry</span>
                <h2>Snowflake connector status</h2>
              </div>
              <div className="stack">
                <article className="card">
                  <div className="card-topline">
                    <span
                      className={
                        snowflakeStatus?.probe.status === 'connected'
                          ? 'pill-good'
                          : snowflakeStatus?.configured
                            ? 'pill'
                            : 'pill-risk'
                      }
                    >
                      {snowflakeLoading
                        ? 'loading'
                        : snowflakeStatus?.probe.status === 'connected'
                          ? 'connected'
                          : snowflakeStatus?.configured
                            ? 'configured'
                            : 'not configured'}
                    </span>
                    <span className="muted">
                      {snowflakeStatus?.connection.config_source ?? 'discovering'}
                    </span>
                  </div>
                  <h3>Real Snowflake integration path</h3>
                  <p>
                    {snowflakeStatus?.message ??
                      'The backend can use a local Snowflake profile or explicit credentials for live telemetry queries.'}
                  </p>
                  {snowflakeStatus && (
                    <div className="status-grid top-gap">
                      <span>
                        <strong>Connection:</strong> {snowflakeStatus.connection.connection_name ?? 'direct env'}
                      </span>
                      <span>
                        <strong>Account:</strong> {snowflakeStatus.connection.account ?? 'not detected'}
                      </span>
                      <span>
                        <strong>User:</strong> {snowflakeStatus.connection.user ?? 'not detected'}
                      </span>
                      <span>
                        <strong>Warehouse:</strong> {snowflakeStatus.connection.warehouse ?? 'not detected'}
                      </span>
                      <span>
                        <strong>Database:</strong> {snowflakeStatus.connection.database ?? 'not detected'}
                      </span>
                      <span>
                        <strong>Schema:</strong> {snowflakeStatus.connection.schema ?? 'not detected'}
                      </span>
                      <span>
                        <strong>Authenticator:</strong> {snowflakeStatus.connection.authenticator ?? 'default'}
                      </span>
                    </div>
                  )}

                  {snowflakeStatus?.probe.status === 'error' && (
                    <div className="notice notice-error top-gap">
                      Probe failed: {snowflakeStatus.probe.error}
                    </div>
                  )}

                  {snowflakeStatus?.probe.status === 'connected' && (
                    <div className="notice top-gap">
                      Connected as {snowflakeStatus.probe.user} on {snowflakeStatus.probe.account} using{' '}
                      {snowflakeStatus.probe.warehouse}.
                    </div>
                  )}

                  <div className="hero-actions top-gap">
                    <button type="button" onClick={handleSnowflakeProbe}>
                      {snowflakeProbing ? 'Probing...' : 'Probe Snowflake connection'}
                    </button>
                  </div>
                </article>

                <article className="card">
                  <h3>Query examples</h3>
                  <div className="chip-row">
                    {snowflakeStatus?.query_examples.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="ghost chip-button"
                        onClick={() => setSnowflakeSql(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </article>
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Query Preview</span>
                <h2>Read-only Snowflake query runner</h2>
              </div>
              <form className="card form-card" onSubmit={handleSnowflakeQuery}>
                <label className="field">
                  <span>SQL</span>
                  <textarea value={snowflakeSql} onChange={(event) => setSnowflakeSql(event.target.value)} rows={7} />
                </label>
                <button type="submit">{snowflakeQuerying ? 'Running...' : 'Run Snowflake preview query'}</button>
              </form>

              {snowflakeQuery ? (
                <div className="stack top-gap">
                  <article className="card">
                    <div className="card-topline">
                      <span className="pill-good">{snowflakeQuery.row_count} rows</span>
                      <span className="muted">{snowflakeQuery.duration_ms} ms</span>
                    </div>
                    <h3>Last Snowflake result</h3>
                    <p className="workflow">Query ID: {snowflakeQuery.query_id ?? 'not available'}</p>
                    <pre className="markdown-preview">{snowflakeQuery.executed_sql}</pre>
                  </article>

                  <article className="card">
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {snowflakeQuery.columns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {snowflakeQuery.rows.map((row, index) => (
                            <tr key={`snowflake-row-${index}`}>
                              {snowflakeQuery.columns.map((column) => (
                                <td key={`${index}-${column}`}>{renderCellValue(row[column])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {snowflakeQuery.truncated && (
                      <p className="muted top-gap">Results were truncated to keep the interview preview lightweight.</p>
                    )}
                  </article>
                </div>
              ) : (
                <article className="card top-gap">
                  <h3>No Snowflake result yet</h3>
                  <p>Run a read-only query to prove the project can use live telemetry instead of synthetic metrics alone.</p>
                </article>
              )}
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Feedback</span>
                <h2>Power BI views and theme backlog</h2>
              </div>
              <div className="stack">
                {overview.power_bi_views.map((item) => (
                  <article className="card" key={item.name}>
                    <div className="card-topline">
                      <span className="mini-chip">{item.audience}</span>
                      <span className="muted">Power BI view</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.purpose}</p>
                    <p className="muted">{item.primary_kpis.join(' · ')}</p>
                  </article>
                ))}
              </div>

              <div className="stack stack-tight top-gap">
                {overview.feedback_themes.map((item) => (
                  <article className="card" key={item.theme}>
                    <div className="card-topline">
                      <span className="pill-risk">{item.volume}</span>
                      <span className="muted">{item.source}</span>
                    </div>
                    <h3>{item.theme}</h3>
                    <p>{item.next_action}</p>
                    <p className="muted">
                      <strong>{item.owner}</strong>
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Facilitation</span>
                <h2>Decision log and objection tracker</h2>
              </div>
              <div className="stack">
                {overview.facilitation_items.map((item) => (
                  <article className="card" key={item.title}>
                    <div className="card-topline">
                      <span className="pill">{item.kind}</span>
                      <span className="muted">{item.due_date}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.note}</p>
                    <div className="meta-row">
                      <span>
                        <strong>Owner:</strong> {item.owner}
                      </span>
                      <span>
                        <strong>Status:</strong> {item.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="stack stack-tight top-gap">
                {overview.objection_log.map((item) => (
                  <article className="card experiment-card" key={item.concern}>
                    <div className="card-topline">
                      <span className="pill-risk">experiment</span>
                      <span className="muted">{item.target_date}</span>
                    </div>
                    <h3>{item.concern}</h3>
                    <p>{item.hypothesis}</p>
                    <p className="muted">
                      <strong>{item.owner}</strong> · {item.success_metric}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Planner</span>
                <h2>Build a Copilot adoption plan</h2>
              </div>
              <form className="card form-card" onSubmit={handlePlan}>
                <label className="field">
                  <span>Interview scenario</span>
                  <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} rows={7} />
                </label>
                <label className="field">
                  <span>Primary audience</span>
                  <select value={audience} onChange={(event) => setAudience(event.target.value as Audience)}>
                    {audienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="chip-row">
                  {overview.sample_requests.map((sample) => (
                    <button key={sample} type="button" className="ghost chip-button" onClick={() => setRequestText(sample)}>
                      {sample}
                    </button>
                  ))}
                </div>
                <button type="submit">{planning ? 'Building...' : 'Build Copilot plan'}</button>
              </form>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Output</span>
                <h2>Executive-ready recommendation</h2>
              </div>
              {plan ? (
                <div className="stack">
                  <article className="card">
                    <div className="card-topline">
                      <span className="pill-good">{plan.confidence_pct}% confidence</span>
                      <span className="muted">{plan.owner_team}</span>
                    </div>
                    <h3>{plan.recommended_program}</h3>
                    <p>{plan.exec_summary}</p>
                    <p className="workflow">Track: {plan.recommended_track}</p>
                  </article>

                  <article className="card">
                    <h3>Rollout phases</h3>
                    <ul className="flat-list">
                      {plan.rollout_phases.map((phase) => (
                        <li key={phase}>{phase}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Priority use cases</h3>
                    <ul className="flat-list">
                      {plan.prioritized_use_cases.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Business case actions</h3>
                    <ul className="flat-list">
                      {plan.business_case_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Readiness actions</h3>
                    <ul className="flat-list">
                      {plan.readiness_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Training and communications</h3>
                    <ul className="flat-list">
                      {plan.training_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                      {plan.communications_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Support and feedback</h3>
                    <ul className="flat-list">
                      {plan.support_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                      {plan.feedback_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Facilitation and value</h3>
                    <ul className="flat-list">
                      {plan.facilitation_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                      {plan.value_actions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Experiments</h3>
                    <ul className="flat-list">
                      {plan.experiments.map((item) => (
                        <li key={item.concern}>
                          <strong>{item.owner}</strong>: {item.concern} {item.success_metric}
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Risks and citations</h3>
                    <ul className="flat-list">
                      {plan.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="top-gap">
                      {plan.citations.map((item) => (
                        <p className="citation" key={item.guide_id}>
                          <strong>{item.title}</strong> · {item.reason}
                        </p>
                      ))}
                    </div>
                  </article>

                  <article className="card">
                    <h3>Agent trace</h3>
                    <ul className="flat-list">
                      {plan.agent_trace.map((item) => (
                        <li key={`${item.agent}-${item.decision}`}>
                          <strong>{item.agent}</strong>: {item.detail}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              ) : (
                <article className="card">
                  <h3>No plan yet</h3>
                  <p>Run the planner with a sponsor scenario to generate a readiness, training, support, and value plan.</p>
                </article>
              )}
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Guides</span>
                <h2>Asset library</h2>
              </div>
              <div className="toolbar">
                <label className="field field-inline">
                  <span>Filter guides</span>
                  <input value={guideQuery} onChange={(event) => setGuideQuery(event.target.value)} placeholder="ADKAR, champions, KPI, facilitation..." />
                </label>
              </div>
              <div className="stack">
                {filteredGuides?.map((guide) => (
                  <button key={guide.id} type="button" className={`guide-card ${selectedGuideId === guide.id ? 'guide-card-active' : ''}`} onClick={() => setSelectedGuideId(guide.id)}>
                    <span className="mini-chip">{guide.category}</span>
                    <strong>{guide.title}</strong>
                    <span>{guide.summary}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Detail</span>
                <h2>Selected guide</h2>
              </div>
              <article className="card detail-card">
                {guideLoading && <p>Loading guide detail...</p>}
                {guideDetail && (
                  <>
                    <div className="card-topline">
                      <span className="pill">{guideDetail.guide.category}</span>
                      <span className="muted">{guideDetail.guide.last_updated}</span>
                    </div>
                    <h3>{guideDetail.guide.title}</h3>
                    <p>{guideDetail.guide.summary}</p>
                    <pre className="markdown-preview">{guideDetail.body}</pre>
                  </>
                )}
              </article>
            </div>
          </section>

          <section className="section two-column">
            <div>
              <div className="section-heading">
                <span className="eyebrow">Readiness Check</span>
                <h2>Preview the rollout packet</h2>
              </div>
              <form className="card form-card" onSubmit={handlePacketPreview}>
                <label className="field">
                  <span>Packet title</span>
                  <input value={packetTitle} onChange={(event) => setPacketTitle(event.target.value)} />
                </label>
                <label className="field">
                  <span>Audience</span>
                  <select value={packetAudience} onChange={(event) => setPacketAudience(event.target.value as Audience)}>
                    {audienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Purpose</span>
                  <input value={packetPurpose} onChange={(event) => setPacketPurpose(event.target.value)} />
                </label>
                <label className="field">
                  <span>Packet body</span>
                  <textarea value={packetBody} onChange={(event) => setPacketBody(event.target.value)} rows={10} />
                </label>
                <button type="submit">{previewing ? 'Checking...' : 'Preview rollout packet'}</button>
              </form>
            </div>

            <div>
              <div className="section-heading">
                <span className="eyebrow">Preview Result</span>
                <h2>Executive review readiness</h2>
              </div>
              {packetPreview ? (
                <div className="stack">
                  <article className="card">
                    <div className="card-topline">
                      <span className={packetPreview.ready_for_exec_review ? 'pill-good' : 'pill-risk'}>
                        {packetPreview.ready_for_exec_review ? 'exec-ready' : 'needs work'}
                      </span>
                      <span className="muted">{packetPreview.readiness_score}/100</span>
                    </div>
                    <h3>{packetPreview.normalized_title}</h3>
                    <p>Use this check before taking a Copilot wave packet into sponsor review.</p>
                  </article>

                  <article className="card">
                    <h3>Checklist</h3>
                    <ul className="flat-list">
                      {packetPreview.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Distribution channels</h3>
                    <ul className="flat-list">
                      {packetPreview.distribution_channels.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Reviewers</h3>
                    <ul className="flat-list">
                      {packetPreview.reviewers.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="card">
                    <h3>Talking points</h3>
                    <ul className="flat-list">
                      {packetPreview.talking_points.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>

                  {packetPreview.warnings.length > 0 && (
                    <article className="card">
                      <h3>Warnings</h3>
                      <ul className="flat-list">
                        {packetPreview.warnings.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  )}
                </div>
              ) : (
                <article className="card">
                  <h3>No preview yet</h3>
                  <p>Run the packet checker to confirm the launch story is ready for executive review.</p>
                </article>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default App;
