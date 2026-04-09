# Production Hardening Runbook

This project is fully deployable today. The remaining hardening step is secret hygiene for GitHub Actions.

## Goal

Replace the current GitHub `CLOUDFLARE_API_TOKEN` secret with a dedicated Cloudflare API token created for CI/CD deployment only.

## Recommended configuration

Use the Cloudflare dashboard to create a token with the **Edit Cloudflare Workers** template, then restrict it to the single Cloudflare account that owns this Worker:

- Account ID: `5ae9190b0d325f6c39a228bf50d188d8`
- Worker name: `m365-copilot-adoption-command-center`
- GitHub repository: `KIM3310/m365-copilot-adoption-command-center`

## GitHub secrets required

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## Rotation steps

1. Open Cloudflare dashboard `My Profile -> API Tokens`.
2. Select `Create Token`.
3. Choose the **Edit Cloudflare Workers** template.
4. Restrict the token to the single account used by this project.
5. Copy the generated token.
6. Update the GitHub repository secret `CLOUDFLARE_API_TOKEN`.
7. Trigger the `Deploy Worker` workflow manually or push a new commit.
8. Confirm that the deployment passes and [api/healthz](https://m365-copilot-adoption-command-center.ehdjs1351.workers.dev/api/healthz) returns `ok`.

## Verification checklist

- GitHub `CI` workflow passes.
- GitHub `Deploy Worker` workflow passes.
- Live site loads on `workers.dev`.
- `GET /api/healthz` returns HTTP `200`.
- `POST /api/assistant/plan` returns a valid planning payload.

## Why this is the last manual step

Cloudflare deployment from local Wrangler login can succeed without a dedicated API token, but production CI should use a separate deploy credential that is scoped, rotatable, and not tied to a workstation login session.
