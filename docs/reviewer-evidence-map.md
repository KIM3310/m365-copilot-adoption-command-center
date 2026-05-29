# Review Guide - Enterprise AI Assistant Adoption Command Center

Updated: 2026-05-30

This repository is archived as a supporting proof. Review it for the reusable pattern, domain evidence, and portfolio relationship; do not treat it as the current flagship unless it is explicitly revived.

## Summary

| Field | Notes |
|---|---|
| Repository | `m365-copilot-adoption-command-center` |
| Status | Archived supporting repository |
| Lane | Microsoft 365 Copilot adoption and value command center |
| Primary reader | CIO offices, digital workplace teams, adoption leads, and Microsoft-focused consultancies. |
| Why it exists | Copilot ROI depends on use-case adoption, governance, enablement, and value tracking after licenses are purchased. |
| Stack | TypeScript/JavaScript, Python, Docker |

## Open First

1. Read the README archived-status note and relationship to active repositories.
2. Inspect `docs/monetization-playbook.md` for the buyer lane and offer ladder.
3. Use the commands below to confirm the proof surface still has a review path.
4. Check CI workflows before making quality claims.
5. Keep the archived status visible in any portfolio conversation.

## Checks

| Purpose | Command |
|---|---|
| Full local gate | `npm run verify` |
| Test suite | `make test` |
| Production build | `npm run build` |

## CI

- .github/workflows/architecture-blueprint.yml
- .github/workflows/ci.yml
- .github/workflows/dependency-review.yml
- .github/workflows/deploy.yml
- .github/workflows/repository-health.yml
- .github/workflows/repository-surface.yml
- .github/workflows/secret-scan.yml

## Evidence

- Synthetic or anonymized data stays clear
- Dashboard metrics are tied to actions
- Governance and enablement are both represented

## Commercial Notes

| Possible offer | Working price assumption | Scope |
|---|---|---|
| Copilot adoption audit | $7k-$25k | Assess current license utilization, use-case mix, and governance gaps. |
| Command-center pilot | $30k-$100k | Deploy dashboards, adoption cohorts, and value rituals for one business unit. |
| Adoption office retainer | $8k-$35k/month | Run monthly value reviews, enablement updates, and governance scorecards. |

## Boundaries

- Do not claim Microsoft endorsement
- Avoid ROI guarantees before baseline data
- Protect tenant and employee telemetry

## Useful Metrics

- Audit starts
- License activation lift
- Use-case adoption
- Monthly retained accounts
