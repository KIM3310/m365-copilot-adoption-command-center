# Enterprise AI Assistant Adoption Command Center

[![CI](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/ci.yml/badge.svg)](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/ci.yml)
[![Deploy Worker](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/deploy.yml/badge.svg)](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/deploy.yml)

Public-safe project for enterprise AI assistant adoption, change management, and value realization.

This repository is not a fake customer story. It is a synthetic enterprise rollout simulation designed to show how the operating model can:

- assess Enterprise AI Assistant readiness,
- prioritize persona-based use cases,
- build training and champions motions,
- design adoption and value KPIs,
- facilitate executive decisions with a visible decision log,
- convert fear, quality, and safety objections into owner-led experiments.

## What this project demonstrates

### 1. Change and readiness leadership
- ADKAR-aligned readiness assessment
- wave entry criteria and action plans
- manager cascade and multilingual communications

### 2. Use case and business case design
- finance, legal, customer service, and executive staff scenarios
- rollout sequencing by persona and region
- value framing beyond license activation

### 3. Adoption analytics and value realization
- analytics-style KPI framing
- weekly active use, repeat use, quality approval, support reopen rate
- sponsor-ready value readout narrative

### 4. Facilitation discipline
- visible timers
- parking lot management
- decision log hygiene
- objection-to-experiment conversion with owners and dates

## Main product surfaces

- **React command center** for system walkthroughs
- **FastAPI backend** with deterministic planning and packet checks
- **Guide library** for readiness, champions, governance, value measurement, and facilitation
- **Walkthrough pack** with system notes and English Q&A prep

## Live links

- GitHub: [KIM3310/m365-copilot-adoption-command-center](https://github.com/KIM3310/m365-copilot-adoption-command-center)
- Live app: [m365-copilot-adoption-command-center.ehdjs1351.workers.dev](https://m365-copilot-adoption-command-center.ehdjs1351.workers.dev)
- Health check: [api/healthz](https://m365-copilot-adoption-command-center.ehdjs1351.workers.dev/api/healthz)

## Quick start

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn backend.app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`.

### Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173`.

### Verify

```bash
pytest
npm run build
npm run test
npm run cf:check
```

## Cloudflare Deployment

This repo now includes a Cloudflare Worker deployment path that serves the built React app as static assets and exposes the walkthrough APIs from the Worker runtime.

### Prepare and dry-run

```bash
npm run cf:check
```

### Deploy

```bash
npm run cf:deploy
```

Files involved:

- [`wrangler.jsonc`](wrangler.jsonc)
- [`cloudflare/worker.ts`](cloudflare/worker.ts)
- [`scripts/export_cloudflare_data.py`](scripts/export_cloudflare_data.py)

## Snowflake Integration

This project now includes actual Snowflake integration code in the Python backend.

What is implemented:

- backend connection discovery from `SNOWFLAKE_*` environment variables
- backend connection discovery from local `~/.snowflake/connections.toml`
- live connection probe endpoint
- read-only Snowflake query preview endpoint
- frontend panel for connection status, probe results, and preview query results

Files involved:

- [`backend/app/snowflake_service.py`](backend/app/snowflake_service.py)
- [`backend/app/main.py`](backend/app/main.py)
- [`src/App.tsx`](src/App.tsx)
- [`.env.example`](.env.example)

Notes:

- The Cloudflare Worker deployment exposes a backend-only Snowflake stub because the live Worker does not run the Python connector.
- The local FastAPI backend can execute real Snowflake queries when your profile or credentials are valid.
- The query runner is intentionally restricted to read-only statements such as `SELECT`, `WITH`, `SHOW`, and `DESCRIBE`.

## GitHub Actions

GitHub Actions is configured for both validation and deployment:

- `CI`: runs backend tests, frontend tests, regenerates the Cloudflare data bundle, verifies generated code is committed, and builds the production frontend.
- `Deploy Worker`: manual deployment workflow that reruns validation, performs a dry-run deploy, deploys to Cloudflare, and smoke-tests `/api/healthz`.

Workflow files:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

## Security Hardening

The deploy workflow is production-ready, but the final best-practice hardening step is to rotate the Cloudflare secret in GitHub to a manually created least-privilege API token.

Recommended final state:

- Create a Cloudflare API token from the Cloudflare dashboard using the **Edit Cloudflare Workers** template.
- Restrict the token to only the target Cloudflare account used by this Worker deployment.
- Store it in the GitHub repository secret named `CLOUDFLARE_API_TOKEN`.
- Keep `CLOUDFLARE_ACCOUNT_ID` set to `5ae9190b0d325f6c39a228bf50d188d8`.

Why this matters:

- GitHub Actions should use a dedicated deploy token rather than a local OAuth session-derived token.
- A scoped token reduces blast radius and makes future rotations simpler.
- This keeps the deployment story aligned with Cloudflare's current GitHub Actions guidance.
- Until that token is rotated, keep deployment manual through `workflow_dispatch` so the repository does not show repeated false-red deploy failures on every push.

Hardening runbook:

- [`docs/production_hardening.md`](docs/production_hardening.md)

## API summary

- `GET /api/overview`
- `GET /api/healthz`
- `GET /api/use-cases`
- `GET /api/guides`
- `GET /api/guides/{guide_id}`
- `GET /api/program-signals`
- `GET /api/readiness`
- `GET /api/business-case`
- `GET /api/support-model`
- `GET /api/facilitation`
- `GET /api/search?q=champion`
- `GET /api/walkthrough/brief`
- `POST /api/assistant/plan`
- `POST /api/rollout-packet/preview`

## Suggested system walkthrough

1. Start on the dashboard and explain the synthetic enterprise scenario.
2. Open the capability-fit board and map each section to the enterprise adoption operating model.
3. Show one persona-based AI assistant use case and its guardrails.
4. Run the planner with a sponsor scenario and explain why the recommendation is structured around readiness, training, support, and value.
5. Show the facilitation board and explain how you keep workshops outcome-focused.
6. Run the rollout packet preview to show how you gate executive communications.

## Documentation map

- [`docs/ai_assistant_readiness_assessment.md`](docs/ai_assistant_readiness_assessment.md)
- [`docs/ai_assistant_business_case_playbook.md`](docs/ai_assistant_business_case_playbook.md)
- [`docs/champion_launch_kit.md`](docs/champion_launch_kit.md)
- [`docs/prompt_review_standard.md`](docs/prompt_review_standard.md)
- [`docs/multi_geo_change_comms.md`](docs/multi_geo_change_comms.md)
- [`docs/value_realization_kpi_dictionary.md`](docs/value_realization_kpi_dictionary.md)
- [`docs/feedback_support_operating_model.md`](docs/feedback_support_operating_model.md)
- [`docs/facilitation_toolkit.md`](docs/facilitation_toolkit.md)
- [`docs/capability_fit.md`](docs/capability_fit.md)
- [`docs/requirement_alignment_matrix.md`](docs/requirement_alignment_matrix.md)
- [`docs/system_walkthrough_english.md`](docs/system_walkthrough_english.md)
- [`docs/operating_story_bank.md`](docs/operating_story_bank.md)
- [`docs/rollout_plan.md`](docs/rollout_plan.md)
- [`docs/walkthrough_storyline.md`](docs/walkthrough_storyline.md)
- [`docs/english_technical_qna.md`](docs/english_technical_qna.md)

## Structure

```text
backend/app/           FastAPI API, planner logic, and synthetic program data
src/                   React adoption dashboard
docs/                  Readiness, champions, KPI, facilitation, and system walkthrough materials
tests/                 Backend API tests
src/test/              Frontend tests
```

## Truthfulness boundary

This project is intentionally public-safe.

- No real customer data
- No claim of real customer delivery
- No live AI assistant tenant dependency
- No fake production telemetry

What is real:

- the operating model,
- the change management structure,
- the KPI logic,
- the facilitation mechanics,
- the quality of the system walkthrough.

## Commercialization Playbook

- [Monetization and GTM playbook](docs/monetization-playbook.md) frames this archived proof as a current buyer conversation, including offer ladder, channels, proof gates, and risk boundaries.

## Cloud + AI Architecture

This repository includes a neutral cloud and AI engineering blueprint that maps the current proof surface to runtime boundaries, data contracts, model-risk controls, deployment posture, and validation hooks.

- [Cloud + AI architecture blueprint](docs/cloud-ai-architecture.md)
- [Machine-readable architecture manifest](docs/architecture/blueprint.json)
- Validation command: `python3 scripts/validate_architecture_blueprint.py`
