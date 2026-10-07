# Real local browser verification

These tests use Chromium, the running Next.js app, real Supabase password auth,
and the public Supabase key with authenticated RLS. They do not use service-role
credentials, mocks, a role switch, or database resets/deletes.

## Prerequisites

- Install dependencies and Chromium: `npm exec playwright install chromium`.
- Start and seed the local Supabase instance using the project database instructions.
- Populate `.env.local` with the active local Supabase URL and public key. The config
  loads this file; the database helper refuses non-local database hosts.
- Primary seeded student must have exactly 47 completed tasks and INR 28,400
  earnings. The workflow refuses a changed baseline **before any workflow write**.
- Run `npm run test:e2e`. Next.js port 3000 is started when not already running.

When the invoking tool has a short shell timeout, start the full suite detached
from the repository root in PowerShell:

```powershell
Start-Process powershell.exe -ArgumentList '-NoProfile', '-File', (Join-Path (Get-Location) 'tests/e2e/run-local.ps1')
```

Poll `tests/e2e/artifacts/suite.log` and `suite.exitcode` rather than issuing a
second test run. Exit code zero is required; log output alone is not success.

The seeded accounts are student01/client01/client02 at campusgig.test; their
documented local-only seed password is used. Environment overrides are available
as `E2E_STUDENT_EMAIL`, `E2E_CLIENT_EMAIL`, `E2E_OTHER_CLIENT_EMAIL`, and
`E2E_PASSWORD`. No credentials or auth tokens are printed in test evidence.

## Coverage

- Public home, task list, how-it-works, login, and registration at 1440, 1280,
  768, 390, and 360px: real HTTP 200, semantic main/heading, keyboard skip link,
  document/body horizontal overflow, browser runtime/console errors.
- Persistent separate client/student browser sessions: analyze a fresh brief,
  publish INR 3,000 task, browse the published task, match/apply, hire, discover
  active work from the dashboard, submit, request revision, resubmit, approve,
  publish review, and see committed public/student proof (48 / INR 31,400).
- Real authenticated database assertions on tasks, applications, contracts,
  submissions, payments, review, matching score, and career proof.
- Negative direct database calls: unrelated client hire/approval, protected
  role/verification updates, payment mutation, second revision, repeated approval.

## State and evidence

The workflow commits one unique timestamped task and intentionally leaves its
real records intact for inspection. Retries are disabled. Coordinate an explicit
database reseed with the owner before a new full run after a successful loop;
the test never resets or deletes records itself. Public-only checks are safe to
repeat: `npm exec playwright test -- tests/e2e/public-responsive.spec.ts`.

The HTML report is under `tests/e2e/artifacts/report`. Screenshots of each public
route/viewport and sanitized database evidence are attached to test results;
failure screenshots/traces are retained under `tests/e2e/artifacts/results`.
Treat browser traces as local diagnostic artifacts: they may include form input
or session information and should not be published as public source code.