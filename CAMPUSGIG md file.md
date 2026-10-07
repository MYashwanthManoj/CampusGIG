# CAMPUSGIG — GOD MODE ENGINEERING SPECIFICATION

> VERSION: 1.0
> STATUS: LOCKED
> PROJECT: CampusGig
> PROBLEM STATEMENT: #43 — Freelance micro-task platform (gig economy for students)
> OPERATING MODE: GOD MODE
> PRIORITY: Correctness > Functionality > UX > Visual polish > Extra features

---

# 0. SYSTEM DIRECTIVE

You are the principal engineer, product architect, UI/UX designer, security engineer,
AI engineer, database architect, QA engineer, and technical lead for CampusGig.

You are NOT a code autocomplete tool.

You must:

1. Understand the existing repository before modifying it.
2. Inspect existing files, architecture, dependencies, routes, database schema,
   components, environment configuration, and implementation status.
3. Never blindly overwrite working code.
4. Never invent functionality that does not exist.
5. Never fake backend functionality with frontend-only state.
6. Never use hardcoded demo data inside React components when that data should
   come from the database.
7. Never disable security controls just to make something work.
8. Never sacrifice core functionality for visual polish.
9. Never introduce unnecessary dependencies.
10. Never create duplicate implementations of the same system.
11. Never make architectural decisions that contradict this specification unless
    the user explicitly authorizes the change.
12. If an existing implementation is better than the proposed implementation,
    preserve it.
13. If something is broken, diagnose the root cause before patching symptoms.
14. After every meaningful implementation, test it.
15. Do not claim something works unless you actually verified it.

The final system must feel like a real product.

It must NOT feel like:
- an AI-generated template
- a university CRUD assignment
- a fake SaaS dashboard
- a collection of disconnected pages
- a frontend prototype pretending to have a backend
- a generic Fiverr clone
- a generic "AI marketplace"

---

# 1. LOCKED PRODUCT

## Product Name

CampusGig

## Problem Statement

#43 — Freelance micro-task platform (gig economy for students)

THIS PROBLEM STATEMENT IS LOCKED.

Do NOT replace it with another problem statement.

Do NOT reinterpret the product into:
- an internship platform
- a generic freelancer marketplace
- a social network
- a job board
- an AI chatbot
- a LinkedIn clone
- an education platform

CampusGig is a student-focused micro-task marketplace.

---

# 2. CORE PRODUCT IDEA

CampusGig connects:

STUDENTS
↓
REAL MICRO-WORK
↓
VERIFIED COMPLETION
↓
REPUTATION
↓
CAREER PROOF
↓
BETTER OPPORTUNITIES

The fundamental product loop is:

WORK → PROOF → REPUTATION → OPPORTUNITY

CampusGig does not merely help students find freelance work.

It turns completed work into measurable career evidence.

---

# 3. VALUE PROPOSITION

### Student
Earn money while building:
- real experience
- portfolio projects
- ratings
- reliability history
- verified skills
- completed-work history

### Client
Find:
- verified student talent
- affordable micro-task workers
- skill-specific candidates
- trustworthy workers
- transparent work history

### CampusGig
Owns the intersection of:

MICRO-WORK
+
STUDENT VERIFICATION
+
SKILL EVIDENCE
+
REPUTATION
+
CAREER PROOF

---

# 4. PRIMARY USP

## Verified Student Work Reputation

Every completed task should contribute meaningful evidence toward the student's professional identity.

Example:

47 tasks completed
96% on-time
4.8/5 rating
₹28,400 earned

Skills:
React — 91%
Next.js — 88%
UI/UX — 84%
Python — 79%

The numbers must eventually be backed by actual database evidence.

Do not manufacture reputation.

Judge one-liner:

> CampusGig doesn't just help students find work — it turns every completed task into career proof.

Product one-liner:

> CampusGig is an AI-powered micro-task marketplace where verified students earn money while turning real-world work into measurable proof of their skills.

---

# 5. USER ROLES

## STUDENT
- Verify college identity
- Profile
- Skills
- Portfolio
- Browse/search tasks
- AI-matched tasks
- Apply
- Communicate
- Work
- Submit
- Earn
- Reviews
- Reputation

## CLIENT
Examples:
- startups
- businesses
- student founders
- campus organizations
- faculty
- event organizers
- NGOs

Capabilities:
- Create task
- AI analyze task
- View ranked student matches
- Review applicants
- Hire
- Track work
- Approve/revise
- Pay
- Review

## ADMIN
- Verification
- Moderation
- Disputes
- Transactions
- Reports
- Analytics
- Suspensions

---

# 6. CORE DEMO LOOP

Client creates task
→ AI analyzes
→ task published
→ students discover
→ AI match
→ apply
→ client hires
→ contract
→ payment
→ student works
→ submits
→ client approves
→ payment releases
→ review
→ reputation updates

This is the primary end-to-end product lifecycle.

---

# 7. LOCKED MVP

## MUST HAVE
- Auth + roles
- Student/client profiles
- Student verification
- Skills + portfolio
- Task marketplace
- Search/filter
- Client task creation
- AI Task Analyzer
- AI Student–Task Matching
- Explainable match score
- Applications
- Hiring/contracts
- Active work
- Submission
- Revision
- Client approval
- Sandbox/demo payment
- Ratings/reviews
- Reputation
- Notifications
- Admin moderation

## SHOULD HAVE
- Messaging
- Saved tasks
- Advanced filters
- Portfolio verification
- Rich notifications
- Admin analytics
- Spatial discovery enhancements

## DO NOT BUILD UNLESS EXPLICITLY REQUESTED
- Video calls
- Social feed
- Freelancer teams
- Subscriptions
- Crypto
- Blockchain
- Native mobile apps
- AI chatbot
- Complex tax handling
- Complex escrow infrastructure
- AI-generated proposals
- AI-generated reviews

---

# 8. PRODUCT EXPERIENCE

CampusGig has TWO experiences.

## A — FUNCTIONAL PRODUCT

For:
- dashboards
- tasks
- applications
- contracts
- work
- payments
- reviews
- admin

It must be:
FAST
CLEAR
PRACTICAL
RELIABLE
EFFICIENT

## B — SIGNATURE DISCOVERY

Primarily `/explore`.

Purpose:
Discover talented students.

May use:
- spatial interaction
- drag
- pan
- zoom
- nodes
- clusters
- visual exploration
- filters
- profile previews

Do not turn the entire product into a spatial experiment.

Use spatial UI where it creates actual product value: discovering people.

---

# 9. DESIGN DIRECTION

The interface must feel:
- premium
- modern
- energetic
- student-focused
- professional
- trustworthy
- technical
- human

Avoid:
- excessive gradients
- glassmorphism
- giant rounded cards
- generic purple AI aesthetic
- repetitive card grids
- decorative blobs
- meaningless animations
- screenshot-first design

Every component must have a reason to exist.

Every screen should answer:

> What should the user do next?

---

# 10. SPATIAL REFERENCE

Conceptual interaction reference:

https://coloniazacamil.com/

Borrow only the exploration philosophy:
EXPLORE → MOVE → DISCOVER → SELECT → LEARN

Do NOT copy:
- branding
- colors
- typography
- assets
- exact layout
- exact animations
- page structure

CampusGig must remain visually and conceptually its own product.

---

# 11. RESPONSIVE REQUIREMENTS

Test at:

- 1440 × 900
- 1280 × 720
- 1024 × 768
- 768 × 1024
- 390 × 844
- 360 × 800

Mobile is not an afterthought.

If spatial exploration is awkward on mobile, provide a clean list fallback.

---

# 12. ACCESSIBILITY

Implement:
- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- proper button semantics
- alt text
- sufficient contrast
- reduced-motion support
- accessible dialogs
- accessible form errors

Animation must never be the only way to communicate information.

---

# 13. TECHNOLOGY STACK

Use:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide Icons
- Supabase
- Zod

Do not introduce another framework without a strong reason.

---

# 14. ARCHITECTURE

Next.js
├── Frontend
├── Server Components
├── Client Components
├── Server Actions
└── Route Handlers
        │
        ↓
    Supabase
    ├── Auth
    ├── PostgreSQL
    ├── Storage
    └── Realtime

AI Provider
└── Server-side AI service

Payment Provider
└── Server-side payment service

Do NOT create a separate Express/Spring backend for the MVP unless explicitly requested.

---

# 15. PROJECT STRUCTURE

Preferred:

campusgig/
├── app/
│   ├── (public)/
│   ├── (student)/
│   ├── (client)/
│   ├── admin/
│   └── api/
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── forms/
│   ├── marketplace/
│   ├── student/
│   ├── client/
│   ├── admin/
│   └── discovery/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── ai/
│   │   ├── providers/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   └── service.ts
│   ├── payments/
│   ├── matching/
│   └── validation/
├── types/
├── hooks/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── scripts/
└── docs/

Adapt to an existing good repository instead of restructuring it unnecessarily.

---

# 16. DATABASE

Use Supabase PostgreSQL.

Core MVP tables:

users
profiles
skills
student_skills
tasks
applications
contracts
submissions
reviews
payments
notifications

Keep the schema small, relational, and understandable.

---

# 17. DATABASE PRINCIPLES

Database state is authoritative.

Never rely on:
- localStorage
- hidden fields
- client-side role checks
- browser-supplied payment amounts
- browser-supplied reputation values
- browser-supplied ownership

for security or business rules.

---

# 18. ROW LEVEL SECURITY

RLS is mandatory.

Never disable RLS to fix a bug.

Fix:
- policies
- ownership checks
- server logic
- relationships

instead.

Every sensitive table needs appropriate RLS policies.

---

# 19. AUTHORIZATION

Every protected operation must verify:

1. authenticated user
2. correct role
3. ownership or permission
4. resource state
5. valid input

Authentication is not authorization.

---

# 20. IDOR PROTECTION

Never trust resource IDs from the browser.

Example:

A student must not access another user's task, contract, submission,
earnings, or private data merely by changing a URL or ID.

Always verify ownership or explicit permission.

---

# 21. STORAGE

Supabase buckets:

avatars
portfolio
task-attachments
submissions

Store metadata/path in PostgreSQL.

Validate:
- MIME type
- extension
- size
- filename
- upload permission

Sensitive files should use private storage.

---

# 22. AI ARCHITECTURE

AI is a real product feature.

Use:

AIService
├── GeminiProvider
├── OpenAIProvider
└── LocalProvider (future)

Configuration:

AI_PROVIDER=gemini
AI_MODEL=...
AI_API_KEY=...

AI API keys must never reach the browser.

---

# 23. AI TASK ANALYZER

Input:
Natural-language task description.

Output:
- category
- required skills
- difficulty
- estimated hours
- suggested budget min/max
- deliverables
- requirements

Example:

Restaurant website redesign
→ Web Development
→ React, CSS, UI/UX
→ Intermediate
→ 12–16 hours
→ ₹2,500–₹4,000

---

# 24. AI OUTPUT VALIDATION

AI output must be structured and validated with Zod.

Flow:

AI
↓
Parse
↓
Zod validation
↓
Normalize
↓
Store

If validation fails:
fallback safely.

Never blindly trust AI JSON.

---

# 25. AI MATCHING

The numerical match score is deterministic.

Recommended weights:

Skill Match       35%
Past Work         25%
Availability      15%
Experience        10%
Rating            10%
Reliability        5%
-----------------------
Total             100%

Example:

Skill Match       32/35
Past Work         23/25
Availability      14/15
Experience         9/10
Rating             9/10
Reliability        5/5
-----------------------
TOTAL             92/100

AI may explain the score.

AI must not arbitrarily invent the score.

---

# 26. AI MATCH EXPLANATION

Explanations must use actual evidence.

Example:

"94% match because the student has completed multiple React projects,
has strong UI/UX evidence, maintains a 96% on-time rate, and has
experience with similar website work."

AI must never invent:
- skills
- projects
- ratings
- experience
- clients
- earnings
- completed work

---

# 27. AI FAILURE FALLBACK

If AI is unavailable:

The marketplace must continue working.

Fallback to:
- manual task fields
- deterministic matching
- normal marketplace functionality

AI improves the product; AI is not the single point of failure.

---

# 28. AI SECURITY

Treat all user input as untrusted.

Protect against prompt injection.

AI must never:
- execute privileged commands
- approve payments
- change roles
- modify reputation directly
- resolve disputes
- bypass authorization
- alter transaction amounts

AI can recommend.

Application logic decides.

---

# 29. AI PERFORMANCE

Avoid unnecessary AI calls.

Use:
- caching
- persisted analysis
- stored match explanations
- controlled regeneration

Never regenerate the same task analysis on every page load.

---

# 30. PAYMENT

MVP uses sandbox/demo payment.

Do not claim this is production banking or real escrow.

Lifecycle:

Client hires
→ payment initiated
→ contract active
→ student completes
→ client approves
→ payment released
→ earnings updated

Statuses:

PENDING
PROCESSING
HELD
RELEASED
FAILED
REFUNDED

---

# 31. PAYMENT SECURITY

The server derives:
- amount
- payer
- recipient
- contract
- payment state

Never trust payment values from the browser.

---

# 32. WORKFLOW STATE MACHINE

Example:

PENDING
↓
ACTIVE
↓
SUBMITTED
↓
REVISION_REQUESTED
↓
RESUBMITTED
↓
APPROVED
↓
COMPLETED

Invalid transitions must be rejected.

---

# 33. REVIEWS

Reviews require:

- valid completed contract
- reviewer is a participant
- review target is a participant
- no duplicate review

No random review creation.

No AI-generated fake reviews.

---

# 34. REPUTATION

Reputation must be derived from actual events:

- completed tasks
- on-time delivery
- client ratings
- successful contracts
- verified skills

Do not manipulate reputation from frontend state.

---

# 35. NOTIFICATIONS

Support:
- application received
- application accepted
- application rejected
- hired
- contract started
- submission received
- revision requested
- work approved
- payment released
- review received
- verification approved/rejected

Notifications should be database-backed.

---

# 36. ROUTES

## PUBLIC

/
 /explore
 /tasks
 /tasks/[id]
 /students/[id]
 /how-it-works
 /login
 /register

## STUDENT

/student/dashboard
/student/tasks
/student/tasks/[id]
/student/applications
/student/applications/[id]
/student/work
/student/work/[id]
/student/earnings
/student/portfolio
/student/profile
/student/notifications
/student/settings

## CLIENT

/client/dashboard
/client/tasks
/client/tasks/new
/client/tasks/[id]
/client/tasks/[id]/applicants
/client/tasks/[id]/workspace
/client/contracts
/client/payments
/client/notifications
/client/settings

## ADMIN

/admin/dashboard
/admin/users
/admin/verification
/admin/tasks
/admin/reports
/admin/disputes
/admin/payments
/admin/analytics

## SHARED

/messages
/notifications
/search
/settings
/help

---

# 37. ROUTE PROTECTION

Protected routes must enforce authorization server-side.

Do not rely only on:
- frontend navigation
- redirects
- hidden buttons
- client-side role checks

---

# 38. MARKETPLACE

Task cards should communicate:

- title
- budget
- deadline
- difficulty
- required skills
- client trust indicators
- match score where applicable

Keep cards information-dense but readable.

---

# 39. TASK DETAIL

Task detail should answer:

WHAT?
WHY?
HOW MUCH?
WHEN?
WHAT SKILLS?
WHO POSTED IT?
WHAT MUST I DELIVER?
WHAT HAPPENS NEXT?

---

# 40. APPLICATION EXPERIENCE

Student flow:

1. Inspect task
2. Understand requirements
3. See match
4. Review evidence
5. Apply
6. Track application

Avoid unnecessary forms.

---

# 41. CLIENT APPLICANT EXPERIENCE

Client should quickly understand:

- student identity
- skills
- relevant work
- rating
- reliability
- match score
- match explanation

Client should be able to:

COMPARE → REVIEW → HIRE

---

# 42. TALENT EXPLORER

`/explore` is a flagship experience.

Potential structure:

Search
↓
Filters
↓
Talent field
↓
Student nodes
↓
Hover/click
↓
Profile preview
↓
Full profile
↓
Hire / view work

Filters:
- skill
- rating
- availability
- experience
- category
- match
- verified status

---

# 43. SPATIAL DATA

Student positions must be derived from actual data.

Possible factors:
- skill clusters
- match score
- category
- experience
- availability

Do not manually hardcode every student position.

---

# 44. DEMO DATA

Seed realistic fictional data:

30 students
10 clients
30–40 tasks

Also:
- applications
- contracts
- submissions
- reviews
- payments
- notifications

Use fictional identities only.

---

# 45. DEMO DATA QUALITY

Do not make every student:
- 95%+ match
- 5.0 rating
- 100% reliable

Include:
- excellent students
- strong students
- average students
- new students
- varied skills
- varied ratings
- varied availability

---

# 46. PRIMARY DEMO STUDENT

Fictional:

Yashwanth Demo

Full-Stack Developer

47 completed tasks
96% on-time
4.8/5 rating
₹28,400 earned

Skills:
React — 91%
Next.js — 88%
UI/UX — 84%
Python — 79%

These are seeded demo values.

Never hardcode them inside React components.

---

# 47. PRIMARY DEMO CLIENT

Demo Client

Use fictional organization information.

---

# 48. PRIMARY DEMO TASK

Restaurant Website Redesign

Budget:
₹3,000

Deadline:
3 days

Difficulty:
Intermediate

Skills:
React
CSS
UI/UX

Description:

Responsive restaurant website redesign with:
- modern homepage
- menu section
- contact form
- reservation section

AI analysis:
Category: Web Development
Estimated effort: 12–16 hours
Suggested budget: ₹2,500–₹4,000

---

# 49. DEMO MATCH

Target approximately:

94%

The score must be produced from seeded evidence and deterministic matching.

Do not fake the score as visual-only data.

---

# 50. SEEDING

Preferred:

supabase/seed.sql
and/or
scripts/seed-demo.ts

Seed operations must be idempotent.

Running the seed multiple times must not create duplicates.

Demo AI analysis must be precomputed.

Do not depend on external AI APIs during seeding.

---

# 51. NO HARDCODED APPLICATION DATA

Bad:

const students = [...]

inside page components.

Good:

Database
↓
Supabase query
↓
Server
↓
Component

Demo data belongs in seed infrastructure.

---

# 52. API DESIGN

Recommended:

/api/tasks
/api/applications
/api/contracts
/api/submissions
/api/reviews
/api/payments
/api/notifications
/api/students
/api/ai/analyze-task
/api/ai/explain-match

Use Server Actions where they simplify secure mutations.

Do not create APIs merely for architecture theater.

---

# 53. VALIDATION

Use Zod for:
- registration
- profile
- task creation
- application
- contract operations
- submissions
- reviews
- payments
- AI responses

Never trust browser input.

---

# 54. ERROR HANDLING

Every major operation must handle:
- success
- validation error
- authorization error
- not found
- conflict
- server error
- dependency failure

Never show raw stack traces to users.

---

# 55. LOADING STATES

Every asynchronous interface needs feedback.

Use:
- skeletons
- spinners where appropriate
- disabled states
- safe optimistic UI when appropriate

---

# 56. EMPTY STATES

Every list needs a useful empty state.

It should explain:
- what is empty
- why it matters
- what the user can do next

---

# 57. PERFORMANCE

Avoid:
- unnecessary client components
- huge JS bundles
- unoptimized images
- repeated AI calls
- N+1 queries
- expensive `/explore` rendering

Prefer:
- server components
- pagination
- selective queries
- caching
- lazy loading
- optimized assets

---

# 58. SECURITY CHECKLIST

[ ] Supabase Auth
[ ] RLS
[ ] Server authorization
[ ] Ownership checks
[ ] Zod validation
[ ] No service-role key in browser
[ ] No secrets in git
[ ] Rate limiting where needed
[ ] Upload validation
[ ] Private sensitive storage
[ ] Prompt injection defense
[ ] Server-side payment validation
[ ] Review authorization
[ ] Admin protection
[ ] Audit trail for sensitive admin/payment actions
[ ] IDOR prevention
[ ] Safe error messages

---

# 59. ENVIRONMENT VARIABLES

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

AI_PROVIDER=
AI_MODEL=
AI_API_KEY=

PAYMENT_PROVIDER=
PAYMENT_SECRET=

Only NEXT_PUBLIC variables may reach the browser.

Never expose:
- service-role keys
- AI keys
- payment secrets

Maintain:

.env.example

---

# 60. GIT RULES

Never commit:
- .env
- .env.local
- API keys
- service-role keys
- payment secrets
- private credentials
- real private user data

---

# 61. DEVELOPMENT WORKFLOW

Before coding:

1. Inspect repository
2. Inspect package.json
3. Inspect routes
4. Inspect Supabase setup
5. Inspect migrations
6. Inspect components
7. Inspect environment configuration
8. Identify working functionality
9. Identify broken functionality
10. Choose the smallest safe implementation

Do not assume the repository is empty.

---

# 62. AFTER CODING

Always:

1. Run typecheck
2. Run lint
3. Run tests
4. Run build
5. Inspect affected pages
6. Verify database behavior
7. Verify authorization
8. Verify responsive behavior
9. Fix discovered issues
10. Report exactly what was verified

---

# 63. NO FAKE SUCCESS

Never say:

"Implemented successfully"

when you only wrote code.

Report accurately:

IMPLEMENTED
TESTED
FAILED
BLOCKED
NOT VERIFIED

Never hide uncertainty.

---

# 64. TESTING STRATEGY

Use:

1. Unit tests
2. Integration tests
3. E2E tests
4. Manual QA

---

# 65. CRITICAL E2E

Client registers
→ creates task
→ AI analyzes
→ publishes
→ student finds task
→ match generated
→ student applies
→ client reviews
→ client hires
→ payment initiated
→ student works
→ submits
→ client approves
→ payment released
→ review created
→ reputation updated

This is the highest-priority E2E test.

---

# 66. AI TEST MATRIX

Test:
- normal task
- long task
- vague task
- missing requirements
- malformed AI response
- invalid JSON
- timeout
- provider failure
- prompt injection
- unsupported input

AI failure must not break the marketplace.

---

# 67. BUSINESS LOGIC TESTS

Test:
- duplicate application
- applying to closed task
- hiring twice
- unauthorized task editing
- unauthorized approval
- duplicate review
- duplicate payment
- invalid contract transition
- unauthorized earnings access
- unauthorized admin operation

---

# 68. RESPONSIVE QA

Check:
- overflow
- navigation
- forms
- dialogs
- tables
- cards
- explorer
- buttons
- wrapping
- touch targets

---

# 69. BROWSER QA

At minimum:
- Chrome
- Edge
- Firefox

---

# 70. ACCESSIBILITY QA

Test:
- keyboard navigation
- tab order
- focus states
- semantic structure
- contrast
- reduced motion
- form labels
- error announcements

---

# 71. DEMO REHEARSAL

The final demo must run without manually editing the database.

Demonstrate:

1. Client creates task
2. AI analyzes
3. Task published
4. Talent discovered
5. Match displayed
6. Student applies
7. Client hires
8. Payment sandbox
9. Student submits
10. Client approves
11. Payment releases
12. Review
13. Reputation updates

---

# 72. DEMO REPUTATION

Before:

47 tasks
₹28,400 earned

After completion:

48 tasks
₹31,400 earned

This must come from actual application logic and database state.

---

# 73. ADMIN

Admin can:
- review users
- verify students
- moderate tasks
- inspect reports
- resolve disputes
- inspect payments
- suspend accounts
- inspect analytics

Admin operations must be protected server-side.

---

# 74. DISPUTES

Flow:

Report
↓
Freeze contract
↓
Admin review
↓
Resolution

Possible:
- full refund
- full release
- partial resolution

AI is never the final dispute authority.

---

# 75. REPUTATION TRUST

Never allow:
- self-created reviews
- fake completion
- rating manipulation
- fake skills
- fake tasks
- frontend-only reputation changes

Trust must come from platform events.

---

# 76. COMPETITIVE POSITIONING

### Fiverr / Upwork

Generic freelancer marketplaces.

### LinkedIn

Professional identity and networking.

### Internshala

Internship-oriented.

### CampusGig

Student-focused micro-work
+
verification
+
real work
+
evidence
+
reputation
+
career proof

CampusGig is not merely "Fiverr for students."

---

# 77. NORTH STAR

Maximize:

VERIFIED SUCCESSFUL STUDENT WORK

Not:
- page views
- AI calls
- number of cards
- animation count
- number of pages

---

# 78. BUILD ORDER

## Phase A — Foundation
- Next.js
- TypeScript
- Tailwind
- shadcn
- Supabase
- Auth
- layouts
- design tokens
- route protection

## Phase B — Marketplace
- profiles
- skills
- task creation
- discovery
- search
- applications
- hiring
- contracts

## Phase C — Workflow
- workspace
- submissions
- revisions
- approval
- payments
- reviews
- reputation

## Phase D — AI
- task analyzer
- deterministic matching
- match explanation

## Phase E — Signature
- talent explorer
- spatial discovery

## Phase F — Polish
- responsive
- accessibility
- errors
- loading
- empty states
- animations
- performance
- QA

---

# 79. IMPLEMENTATION STRATEGY

Build vertical slices.

Preferred:

AUTH
↓
PROFILE
↓
TASK
↓
APPLICATION
↓
CONTRACT
↓
WORK
↓
PAYMENT
↓
REVIEW
↓
REPUTATION

A complete vertical slice is more valuable than ten unfinished screens.

---

# 80. DEPENDENCY RULE

Before adding a package:

Ask:

Can this be implemented safely with the current stack?

If yes:

Do not add the dependency.

Avoid dependency bloat.

---

# 81. COMPONENT RULE

Create reusable components when repetition is real.

Do not create:
StudentCard1
StudentCard2
StudentCard3

But also do not abstract prematurely.

---

# 82. STATE MANAGEMENT

Prefer:

Server state:
Supabase + Server Components

Local UI:
React state

Forms:
validated local/form state

Do not introduce a global state library unless actual complexity requires it.

---

# 83. SERVER / CLIENT BOUNDARY

Default to Server Components.

Use Client Components only for:
- interaction
- browser APIs
- animation
- spatial explorer
- local state

Do not make the entire application `"use client"`.

---

# 84. DATA FETCHING

Fetch only required fields.

Avoid unnecessary:

SELECT *

Prefer:
- specific columns
- appropriate relationships
- pagination

---

# 85. SEARCH

Search should eventually be database-backed.

Do not download every student/task into the browser and filter everything in JavaScript.

---

# 86. DASHBOARD PRINCIPLE

A dashboard must answer:

1. What happened?
2. What needs attention?
3. What can I do next?

Do not fill dashboards with meaningless metrics.

---

# 87. STUDENT DASHBOARD

Prioritize:
- active work
- recommended tasks
- applications
- earnings
- reputation
- skill evidence
- notifications

---

# 88. CLIENT DASHBOARD

Prioritize:
- active tasks
- applicants
- contracts
- pending approvals
- payments
- recommended talent

---

# 89. MOTION

Animation should communicate:
- state changes
- hierarchy
- navigation
- discovery
- feedback

Respect:

`prefers-reduced-motion`

No animation for decoration alone.

---

# 90. FORMS

Every form needs:
- labels
- validation
- errors
- loading state
- disabled state
- success state
- accessible feedback

Do not rely only on placeholders.

---

# 91. TABLES

For admin/data-heavy screens:

Prefer clear tables over giant card grids.

Use:
- sorting
- filters
- pagination
- status indicators

when useful.

---

# 92. DATA INTEGRITY

If a feature requires a database change:

Create a migration.

Do not mutate production schema through random application code.

---

# 93. MIGRATIONS

Migrations must be:
- ordered
- understandable
- reproducible
- safe

Do not casually rewrite already-applied migrations.

---

# 94. SEEDING

Seed data must be:
- deterministic
- fictional
- realistic
- idempotent

Do not require external AI APIs to seed demo data.

---

# 95. DEMO RELIABILITY

The hackathon demo must not depend on:
- random AI output
- unstable external services
- live payment networks
- manually edited database rows

Use deterministic seeded data and safe fallbacks.

---

# 96. BUSINESS MODEL

Initial:
Transaction fee.

Future:
- organization plans
- campus partnerships
- premium employer access
- verification services

Do not overbuild monetization for MVP.

---

# 97. PITCH

Maximum 12 slides:

1. Hook
2. Problem
3. Solution
4. Differentiation
5. AI
6. Trust/Reputation
7. Spatial Discovery
8. Workflow
9. Architecture
10. Business Model
11. Impact
12. Closing

Closing:

> Your degree says what you studied.
> Your work shows what you can do.

> CampusGig — Turn student skills into real work.
> Turn real work into career proof.

---

# 98. DEFINITION OF DONE

A feature is NOT DONE when:
- component exists
- page renders
- button exists
- mock data appears

A feature is DONE when:

[ ] UI exists
[ ] Backend logic exists
[ ] Database integration exists
[ ] Validation exists
[ ] Authorization exists
[ ] Loading state exists
[ ] Error state exists
[ ] Empty state exists
[ ] Responsive behavior works
[ ] Accessibility is reasonable
[ ] Tests exist where appropriate
[ ] Real data flows through it
[ ] Security was considered
[ ] Feature was manually verified

---

# 99. FINAL QA GATE

## FUNCTIONAL

[ ] Auth
[ ] Student profiles
[ ] Client profiles
[ ] Verification
[ ] Skills
[ ] Portfolio
[ ] Task creation
[ ] Task discovery
[ ] Search
[ ] Applications
[ ] Matching
[ ] Hiring
[ ] Contracts
[ ] Work submission
[ ] Revision
[ ] Approval
[ ] Payment sandbox
[ ] Reviews
[ ] Reputation
[ ] Notifications

## AI

[ ] Task Analyzer
[ ] Deterministic matching
[ ] Match explanation
[ ] Structured output
[ ] AI fallback
[ ] Prompt injection protection

## SECURITY

[ ] RLS
[ ] Authorization
[ ] Ownership
[ ] IDOR protection
[ ] Input validation
[ ] Upload validation
[ ] Secret protection
[ ] Payment validation
[ ] Review authorization
[ ] Admin protection

## UX

[ ] Responsive
[ ] Accessible
[ ] Loading states
[ ] Empty states
[ ] Error states
[ ] Keyboard navigation
[ ] Reduced motion

## QUALITY

[ ] Typecheck
[ ] Lint
[ ] Build
[ ] Tests
[ ] E2E
[ ] Manual QA

## DEMO

[ ] Demo data seeded
[ ] Client flow works
[ ] Student flow works
[ ] AI works
[ ] Explorer works
[ ] Payment sandbox works
[ ] Reputation updates
[ ] No manual DB manipulation required

---

# 100. FINAL OPERATING COMMAND

When working on CampusGig:

Do NOT ask:

"What can I quickly generate?"

Ask:

"What is the smallest production-quality implementation that correctly solves this problem?"

Do NOT optimize for:
- lines of code
- number of components
- number of pages
- number of AI calls
- visual complexity

Optimize for:

CORRECTNESS
TRUST
USABILITY
PERFORMANCE
SECURITY
DEMONSTRABILITY
MAINTAINABILITY
REAL PRODUCT VALUE

Build CampusGig as if real students and real clients will use it.

Every completed task should mean something.

Every reputation point should be earned.

Every AI decision should be explainable.

Every payment state should be trustworthy.

Every permission should be enforced.

Every screen should have a purpose.

Every interaction should move the user forward.

The core loop is:

WORK
↓
PROOF
↓
REPUTATION
↓
OPPORTUNITY

That is CampusGig.

# END OF GOD MODE SPECIFICATION
