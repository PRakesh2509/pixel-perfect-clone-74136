## PlaceAI — AI-Powered Placement Platform

Build a full working app based on the uploaded PlaceAI guide + backend spec, using Lovable Cloud (auth + database) and Lovable AI Gateway (replacing the Claude/Anthropic direct calls).

### Stack
- TanStack Start (existing), Tailwind, shadcn
- Lovable Cloud: auth (email/password), Postgres for user profiles, resumes, interview sessions
- Lovable AI Gateway via `createServerFn` — model `openai/gpt-5.5` with structured JSON output
- No Anthropic key needed; users don't bring their own key

### Pages / routes
- `/` — Landing page (hero, features, CTA to sign up)
- `/auth` — Sign in / sign up (email + password)
- `/_authenticated/dashboard` — Overview: profile score, quick links, recent activity
- `/_authenticated/resume` — Paste/edit resume → AI analysis (ATS score, strengths, improvements, skills)
- `/_authenticated/jobs` — Seeded sample jobs → AI match with fit %, gaps, negotiation tips
- `/_authenticated/interview` — Generate 5 personalized questions → practice → AI-evaluate answer
- `/_authenticated/roadmap` — Generate 90-day upskilling plan based on gaps

### Backend (Lovable Cloud)
Tables (with RLS, grants, `user_roles` pattern not needed — no admin surface):
- `profiles` (id=auth.uid, target_role, skills text[], experience)
- `resumes` (user_id, content, analysis jsonb, updated_at)
- `job_matches` (user_id, job_id, analysis jsonb)
- `interview_sessions` (user_id, question, answer, evaluation jsonb, created_at)
- `roadmaps` (user_id, plan jsonb, created_at)
- Sample `jobs` table seeded via migration (public read)

### Server functions (`src/lib/*.functions.ts`, protected via `requireSupabaseAuth`)
- `analyzeResume(resume)` → JSON {atsScore, strengths, improvements, skillsFound, skillsMissing, summary}
- `matchJobs(skills, targetRole, resume)` → per-job fit analysis
- `generateInterviewQuestions(role, skills)` → 5 questions
- `evaluateAnswer(question, answer, role)` → score + feedback
- `generateRoadmap(currentSkills, targetRole, gaps)` → 90-day plan

All use AI SDK + `createLovableAiGatewayProvider` with `{ structuredOutputs: true }`, storing results in the DB.

### Design direction
Modern, confident, career-tech aesthetic — deep navy + electric accent, generous whitespace, clean sans-serif. Not purple-gradient AI cliché. Cards with soft shadows, subtle motion.

### Deliverables in this build
1. Enable Lovable Cloud + provision LOVABLE_API_KEY
2. DB migrations (tables, RLS, grants, sample jobs seed)
3. Auth page + `_authenticated` layout gate
4. All 5 feature pages wired to server functions
5. Landing page with hero + feature grid
6. Semantic design tokens in `src/styles.css`
7. Sitemap, robots, llms.txt, real head metadata

### Out of scope
- Payments / pricing tiers
- Recruiter / admin dashboards
- Real job scraping (use seeded sample jobs)
- Resume file upload/parsing (paste text only for v1)
