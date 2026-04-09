# Microsoft 365 Copilot Adoption Command Center

[![CI](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/ci.yml/badge.svg)](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/ci.yml)
[![Deploy Worker](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/deploy.yml/badge.svg)](https://github.com/KIM3310/m365-copilot-adoption-command-center/actions/workflows/deploy.yml)

Portfolio-safe project tailored for the **AI Adoption Architect / Consultant** role at Microsoft.

This repository is not a fake customer story. It is a synthetic enterprise rollout simulation designed to show how I would:

- assess Microsoft 365 Copilot readiness,
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
- Power BI-style KPI framing
- weekly active use, repeat use, quality approval, support reopen rate
- sponsor-ready value readout narrative

### 4. Facilitation discipline
- visible timers
- parking lot management
- decision log hygiene
- objection-to-experiment conversion with owners and dates

## Main product surfaces

- **React command center** for interview walkthroughs
- **FastAPI backend** with deterministic planning and packet checks
- **Guide library** for readiness, champions, governance, value measurement, and facilitation
- **Interview pack** with talk track and English Q&A prep

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

This repo now includes a Cloudflare Worker deployment path that serves the built React app as static assets and exposes the interview APIs from the Worker runtime.

### Prepare and dry-run

```bash
npm run cf:check
```

### Deploy

```bash
npm run cf:deploy
```

Files involved:

- [`wrangler.jsonc`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/wrangler.jsonc)
- [`cloudflare/worker.ts`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/cloudflare/worker.ts)
- [`scripts/export_cloudflare_data.py`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/scripts/export_cloudflare_data.py)

## Snowflake Integration

This project now includes actual Snowflake integration code in the Python backend.

What is implemented:

- backend connection discovery from `SNOWFLAKE_*` environment variables
- backend connection discovery from local `~/.snowflake/connections.toml`
- live connection probe endpoint
- read-only Snowflake query preview endpoint
- frontend panel for connection status, probe results, and preview query results

Files involved:

- [`backend/app/snowflake_service.py`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/backend/app/snowflake_service.py)
- [`backend/app/main.py`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/backend/app/main.py)
- [`src/App.tsx`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/src/App.tsx)
- [`.env.example`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/.env.example)

Notes:

- The Cloudflare Worker deployment exposes a backend-only Snowflake stub because the live Worker does not run the Python connector.
- The local FastAPI backend can execute real Snowflake queries when your profile or credentials are valid.
- The query runner is intentionally restricted to read-only statements such as `SELECT`, `WITH`, `SHOW`, and `DESCRIBE`.

## GitHub Actions

GitHub Actions is configured for both validation and deployment:

- `CI`: runs backend tests, frontend tests, regenerates the Cloudflare data bundle, verifies generated code is committed, and builds the production frontend.
- `Deploy Worker`: manual deployment workflow that reruns validation, performs a dry-run deploy, deploys to Cloudflare, and smoke-tests `/api/healthz`.

Workflow files:

- [`.github/workflows/ci.yml`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/.github/workflows/ci.yml)
- [`.github/workflows/deploy.yml`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/.github/workflows/deploy.yml)

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

- [`docs/production_hardening.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/production_hardening.md)

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
- `GET /api/interview/brief`
- `POST /api/assistant/plan`
- `POST /api/rollout-packet/preview`

## Suggested interview walkthrough

1. Start on the dashboard and explain the synthetic enterprise scenario.
2. Open the role-fit board and map each section to the Microsoft job description.
3. Show one persona-based Copilot use case and its guardrails.
4. Run the planner with a sponsor scenario and explain why the recommendation is structured around readiness, training, support, and value.
5. Show the facilitation board and explain how you keep workshops outcome-focused.
6. Run the rollout packet preview to show how you gate executive communications.

## Documentation map

- [`docs/copilot_readiness_assessment.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/copilot_readiness_assessment.md)
- [`docs/copilot_business_case_playbook.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/copilot_business_case_playbook.md)
- [`docs/champion_launch_kit.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/champion_launch_kit.md)
- [`docs/prompt_review_standard.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/prompt_review_standard.md)
- [`docs/multi_geo_change_comms.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/multi_geo_change_comms.md)
- [`docs/value_realization_kpi_dictionary.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/value_realization_kpi_dictionary.md)
- [`docs/feedback_support_operating_model.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/feedback_support_operating_model.md)
- [`docs/facilitation_toolkit.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/facilitation_toolkit.md)
- [`docs/role_fit.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/role_fit.md)
- [`docs/jd_alignment_matrix.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/jd_alignment_matrix.md)
- [`docs/demo_script_english.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/demo_script_english.md)
- [`docs/star_story_bank.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/star_story_bank.md)
- [`docs/thirty_sixty_ninety_plan.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/thirty_sixty_ninety_plan.md)
- [`docs/interview_storyline.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/interview_storyline.md)
- [`docs/english_technical_qna.md`](/Users/dolphin/Downloads/Codex/m365-copilot-adoption-command-center/docs/english_technical_qna.md)

## Structure

```text
backend/app/           FastAPI API, planner logic, and synthetic program data
src/                   React interview dashboard
docs/                  Readiness, champions, KPI, facilitation, and interview materials
tests/                 Backend API tests
src/test/              Frontend tests
```

## Truthfulness boundary

This project is intentionally portfolio-safe.

- No real customer data
- No claim of real Microsoft customer delivery
- No live Copilot tenant dependency
- No fake production telemetry

What is real:

- the operating model,
- the change management structure,
- the KPI logic,
- the facilitation mechanics,
- the quality of the interview story.
