# Security Policy

## Supported Versions

Security fixes are applied to the default branch. Consumers should run the latest commit or latest tagged release when available.

## Reporting a Vulnerability

Do not open a public issue for suspected vulnerabilities. Use GitHub private vulnerability reporting if it is enabled for this repository, or contact the repository owner through their GitHub profile.

Please include:

- A clear description of the issue and affected component
- Reproduction steps or a minimal proof of concept
- Potential impact and any known mitigations
- Whether tenant data, adoption telemetry, credentials, or exports may be exposed

## Security Expectations

- Never commit Microsoft tenant secrets, admin tokens, exports containing user data, or customer telemetry.
- Keep demo data synthetic unless a private customer deployment explicitly requires otherwise.
- Run local verification before merging:

```bash
python -m ruff check .
python -m pytest -q
npm run verify
```
