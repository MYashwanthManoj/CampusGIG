# CampusGig database (P0)

Postgres 15 + Supabase Auth; no service-role key is needed by the application.
All accounts, work, reviews, and simulated balances in `seed.sql` are **fictional**.
`seed.sql` is the only seed source and runs after the migration. Never load it
into a production project. There are no payment-provider or blockchain integrations.

## Local setup

From the repository root, with Docker running and the Supabase CLI installed:

```sh
supabase start
supabase db reset
supabase test db
supabase status
```

The checked-in ports avoid Windows' blocked 5432x range: API `http://127.0.0.1:55421`,
Postgres `55422`, shadow database `55420`, Studio `55423`, local mail `55424`.
The web application's auth site URL is `http://localhost:3000`. Obtain the local
publishable/anonymous API key from `supabase status`; do not commit local environment
files or copy service-role credentials into the application. Email confirmation
is disabled **only in this local config**. Configure production confirmation,
redirect allowlists and SMTP separately.

### Fictional local sign-ins

All seeded users have local-only password `CampusGigLocal!2026`:

* `student01@campusgig.test`: **Yashwanth Demo**, explicitly verified primary student.
* `student02@campusgig.test` through `student24@campusgig.test`: fictional new students.
* `client01@campusgig.test`: **Demo Client**.
* `client02@campusgig.test` through `client08@campusgig.test`: fictional clients.

UUIDs are deterministic: `md5('campusgig:' || kind || ':' || index)::uuid`.
For example the primary student's ID is `md5('campusgig:student:1')::uuid`;
skills use `md5('campusgig:skill:' || slug)::uuid`.
Auth users have confirmed emails and email identities. Seed inserts are idempotent
and the primary aggregates are checked in the seed transaction. Rerunning against
an unchanged local dataset produces no duplicate rows. Reset after demo mutations
to restore the baseline; the seed is not a repair script for modified workflows.

## Schema and reads

The thirteen canonical tables are `profiles`, `skills`, `student_skills`, `tasks`,
`task_skills`, `applications`, `contracts`, `submissions`, `reviews`, `payments`,
`notifications`, `verification_records`, `reputation_events`. Every table enables RLS.

* `profiles`: `id`, immutable `role` (`student/client/admin`), `full_name`, `headline`,
  `college`, `bio`, `avatar_path`, admin-controlled boolean `verified_status`.
  Auth signup permits only student/client; verification metadata is never trusted.
  Private profile reads are self or application/contract participants. Editable
  columns are explicitly granted; roles, verification, identities and timestamps
  cannot be mass-assigned by a runtime caller.
* `public_student_profiles` is a `security_invoker` view over a fixed-column safe
  projection RPC, `get_public_student_profiles()`. This intentionally does **not**
  grant public access to private `profiles` rows. Its columns are `id`, `full_name`,
  `headline`, `college`, `bio`, `avatar_path`, `verified_status`.
* Skills and open tasks are public reads. Use `task_skills(skill_id,skills(id,slug,name))`
  in PostgREST queries; task skills are relational, not an AI string array.
* Applications, contracts, submissions, reviews, payments, and events are readable
  only by their participants. Notifications and verification records are owner-only.
* Money is **INR rupees**, `numeric(12,2)`, not paise; UI formatting should use
  `Intl.NumberFormat`. Tasks use `fixed_price` and contracts immutable `agreed_amount`.
  Prices are positive, at most INR 1,000,000, max two decimal places at the RPC boundary.
* Task `deadline`, contract `due_at/submitted_at/completed_at/started_at` and submission
  `submitted_at` are `timestamptz`. Student reliability uses the **first** submission
  time, not delayed client approval or a revision timestamp.

Canonical states: task `OPEN/IN_PROGRESS/SUBMITTED/REVISION_REQUESTED/COMPLETED/CANCELLED`;
application `PENDING/SHORTLISTED/ACCEPTED/REJECTED/WITHDRAWN`; contract
`ACTIVE/SUBMITTED/REVISION_REQUESTED/COMPLETED/CANCELLED`; payment
`HELD/RELEASED/REFUNDED/FAILED`. Cancellation/refund states are representable but
there is no P0 cancellation/refund RPC and no fictional refund UI behavior.

## Server-authoritative API

All mutation RPCs require an authenticated Supabase session and the appropriate
profile role. No client-supplied IDs for actors, scores, verification or payments.
Functions use `SECURITY DEFINER`, empty `search_path`, qualified relation names,
explicit execution grants, role/ownership checks and transaction locks.

| RPC | Result |
| --- | --- |
| `publish_task(p_title text,p_description text,p_fixed_price numeric,p_deadline timestamptz,p_analysis jsonb,p_analysis_source text,p_skill_slugs text[],p_request_id uuid default null)` | task UUID |
| `apply_to_task(p_task_id uuid,p_cover_note text)` | application UUID |
| `hire_application(p_application_id uuid)` | contract UUID |
| `submit_work(p_contract_id uuid,p_work_url text,p_summary text)` | submission UUID |
| `request_revision(p_contract_id uuid,p_feedback text)` | void |
| `approve_work(p_contract_id uuid)` | void |
| `review_work(p_contract_id uuid,p_rating integer,p_comment text)` | review UUID |
| `declare_skill(p_skill_slug text)` | void |
| `get_student_evidence(p_student_id uuid,p_task_id uuid)` | JSON |
| `get_career_proof(p_student_id uuid)` | public-safe JSON |

`publish_task` persists `ai_analysis`, `ai_source` (`live/fallback/mock`),
`ai_hours_min/max`, `ai_deliverables/requirements`, `difficulty`, `ai_category`.
AI output describes the brief; it never assigns authoritative match or reputation.
`ai_source` is caller-provided provenance, **not** a database-verified AI attestation;
the Next.js signed preview protects normal UI publishing, while a direct authenticated
RPC caller can author analysis on their own task. They still cannot forge scores,
student work evidence, roles, reviews from other clients, or payment transitions.
Canonical slugs are `react,nextjs,css,uiux,python,design,video,spreadsheet,writing`.
Zero to six required skill slugs are accepted, unknown aliases are rejected.
The optional signed preview request nonce prevents duplicate publishing on retries;
the unique `(client_id,publish_request_id)` plus profile lock returns the original
task UUID. Omitting the nonce remains compatible with the seven-argument RPC.

`get_student_evidence` returns `studentId`, `skills[{slug,name,evidenceScore}]`,
`completedCount`, `relevantCompletedCount`, `activeContractCount`, `averageRating`
(nullable), `onTimeRate` (0..1). Relevant work counts each completed contract **once**
if any required skill overlaps; no required skills means zero relevant work.

The SQL score mirrors the pure TypeScript domain formula using positive `round`:
skill = round(35 × mean(required skill evidence / 100; missing=0)), pastWork =
round(25 × min(relevant completed / 6,1)), availability = 15/8/0 for 0/1/2+ active,
experience = round(10 × min(log2(completed+1)/6,1)), rating = round((avg or 0)/5 × 10),
reliability = round(on-time rate × 5). Sum is stored in immutable application fields;
`match_breakdown` contains those six keys and `total`. Evidence snapshots preserve
the application-time facts. A declared skill alone has zero evidence; completion
recomputes `round(100 × min(skill completed count / 6,1))`, an **evidence signal**,
not an AI-certified proficiency percentage.

`get_career_proof` returns `completedCount,onTimeRate,averageRating,earnedAmount`,
`recentWork[{id,contractId,taskId,title,completedAt,rating,skills}]`,
`skills[{id,slug,name,evidenceScore,completedCount}]` and `studentId`.
It never returns submission URLs or private client/profile rows.

Hire locks the task, accepts exactly one application, rejects others, creates one
contract and one **simulated** HELD payment using the confirmed price. Submission
locks the contract, max two immutable attempts. Exactly one revision is allowed.
Approval atomically completes task+contract, releases simulated payment, recalculates
evidence, appends `WORK_COMPLETED`, and notifies the student. One immutable review
per completed contract appends `REVIEW_RECEIVED`. Events, reviews and submissions
are append-only, even for direct owner SQL updates; workflow table DML is revoked
from application roles. Runtime writes to notifications are limited to `read_at`.

## Deterministic seed claims and tests

The baseline has 24 students, 8 clients, 30 OPEN tasks, and 47 primary completed
contracts. Released amounts are `46 × 600 + 800 = INR 28,400`. First submissions
are on time for 45/47. Reviews are `38 × 5 + 9 × 4 = 226`, average `226/47`,
which displays **4.8** to one decimal place. Seed assertions check each claim.
Only the primary student has historical work; other declared skills remain zero.

`tests/authorization.sql` exercises grants/RLS, profile protection, score immutability,
canonical skill declarations, duplicate applications and fictional aggregates.
`tests/workflow.sql` exercises the complete publish/apply/hire/submit/revise/approve/
review transaction chain and uniqueness/evidence invariants. `tests/concurrency.sql`
uses `dblink` independent sessions to verify task and contract row locks block
concurrent hires/approvals and state checks reject duplicates once locks release.
These are real SQL tests, not a claim of exhaustive distributed load testing.
Tests run in rollback transactions; the concurrency tests only lock preexisting
seed rows and roll back remote transactions. Use a disposable local database.
Supabase's local `postgres` is not a superuser; ordinary `supabase test db` skips
the four dblink tests. Execute them separately as the local administrator:

```sh
docker cp supabase/tests/concurrency.sql supabase_db_campusgig:/tmp/concurrency.sql
docker exec supabase_db_campusgig psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -f /tmp/concurrency.sql
```

Validation evidence: the migration and seed have run against the local Supabase
Postgres Docker container; reapplying the unchanged seed succeeded. Authorization,
workflow and independent-session lock tests have been run against that database.
Any skipped tests must not be reported as passed. No hosted production DB was used.

Recorded local result: `supabase test db` reported `Files=3, Tests=58, Result: PASS`
(54 executed plus four concurrency checks skipped for the non-superuser CLI role).
The administrator `psql` command above then executed all four independent-session
checks and reported `ok 1` through `ok 4`. Thus 58 distinct assertions were actually
executed successfully across the two runs. The final seed rerun reported
`BEGIN / DO / COMMIT`, including its aggregate assertions. These results precede
any later end-to-end application mutations. Do not rerun baseline seed assertions
against a subsequently changed acceptance-test dataset without a disposable reset.