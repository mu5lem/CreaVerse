# CreaVerse — Education for Everyone

> **Learn, Visualize, and Build Things.**
> A Pakistan-first, open-source learning universe for students, teachers, and creators — organised into three groups: **School-in-a-Box**, **Outreach** and **Mind Garden**.

---

## The story behind CreaVerse

CreaVerse was not built inside a Silicon Valley co-working space. It was built by a student from **Dera Ghazi Khan**, a small city in southern Punjab, Pakistan — a place where quality education is more of a rumor than a reality for most children.

For years I watched brilliant classmates lose the game not because they lacked intelligence, but because the system rewards **rote learning over understanding**. You memorize a paragraph, you write it back, you pass. You never see the atom. You never build the circuit. You never ask *why*.

I got lucky. On merit, I earned a seat at a **Daanish school** — a government-backed institution that gives high-quality residential education to talented students from underprivileged backgrounds. Sitting in a real lab for the first time, with real teachers and real books, I realized how enormous the gap was between what education *could* be and what it usually *is* for millions of Pakistani children — especially in villages, out-of-school populations, and low-income urban families.

CreaVerse is my answer to that gap.

It is a **full-stack, open, free-to-use learning platform** designed for the students who don't have access to expensive tutors, elite schools, or foreign apps that never spoke their language. It brings together:

- **School-in-a-Box** — an AI mentor that explains things patiently (English or Urdu), a free Academy of curated pathways with progress tracking, and a real classroom system with live chat, self-grading quizzes and assignments.
- **Outreach** — one directory of scholarships and universities, contests and learning communities that most students never hear about.
- **Mind Garden** — a private daily journal with a real streak, and a memory game, because learning is a habit, not an event.

It is built to run on a low-end Android phone with a bad signal, and it is built to stay free.

**— The Founder, from Dera Ghazi Khan to the rest of Pakistan.**

---

## The three groups

| Group | What's inside |
| --- | --- |
| 🎒 **School-in-a-Box** (main) | **AI Mentor** (persistent, bilingual, with deep links from the Academy), **Academy** (search, level filters, per-pathway progress, "continue where you left off"), **Classroom** (live classes, chat, quizzes, assignments, grades, analytics, weak-area suggestions) |
| 🧭 **Outreach** | **Opportunities + Contests + Community** on one page (`/outreach`) with shared search, filters and "Load more" |
| 🌱 **Mind Garden** | **Journal + Memory Game** on one page (`/mind-garden`); the journal streak is maintained by the database |

FAQ, Contact, Privacy and Terms are small links at the bottom of every page.

Also: 🔐 username + password accounts (no email needed), 👩‍🏫 teacher onboarding by invite code or admin approval, and 🌍 built for Pakistan first, the world next.

---

## Tech stack

- **Frontend:** React 19, TanStack Start v1 (file-based routing + server functions), TanStack Query, Tailwind CSS v4.
- **Backend:** Lovable Cloud (Supabase-managed) — Postgres with strict RLS, Auth, Realtime, Storage, Edge functions.
- **AI:** Lovable AI Gateway (chat completions, retrieval, embeddings).
- **Deployment:** Lovable's managed pipeline, or Vercel (Nitro preset). Set `VITE_SITE_URL` to your public domain for correct canonical/OG/sitemap URLs.
- **Design system:** Editorial ivory + deep-ink navy + amber accent. Semantic tokens only; dark-mode ready.

---

## Repository layout

```
src/
├── routes/               # File-based routes (TanStack Start)
│   ├── __root.tsx        # App shell, head metadata, service worker guard
│   ├── index.tsx         # Landing page
│   ├── auth.tsx          # Username + password sign in / sign up
│   ├── student.*.tsx     # Student dashboard & classes
│   ├── teacher.*.tsx     # Teacher dashboard & class management
│   ├── admin.dashboard   # Admin console
│   ├── mentor.tsx        # AI mentor chat
│   ├── academy.tsx       # Academy (data lazy-loaded from lib/academy-data)
│   ├── outreach.tsx      # Opportunities | Contests | Community
│   ├── mind-garden.tsx   # Journal | Memory Game
│   └── ...
├── components/           # Presentational + shared UI
├── hooks/                # useAuth, useDraft, useConfirm, use-mobile
├── lib/                  # brand config, static content, server functions
└── integrations/supabase # Auto-generated client & types
```

Old URLs (`/opportunities`, `/contests`, `/community`, `/journal`, `/minigame`) redirect to the new pages.

Never edit `src/routeTree.gen.ts` or any file under `src/integrations/supabase/` — those are managed by the build.

---

## Local development

```bash
git clone <your-fork-url> creaverse && cd creaverse
bun install
cp .env.example .env   # fill in your Supabase values
bun run dev            # http://localhost:8080
```

## Configuring Supabase

1. Create a Supabase project and copy its URL and publishable (anon) key into `.env`.
2. Apply the SQL in `supabase/migrations/` in order (e.g. `supabase db push` with the Supabase CLI).
3. In **Authentication → Providers → Email**, keep email sign-in enabled and **turn off "Confirm email"**. Accounts use an internal address like `username@users.creaverse.local`, so no email is ever sent.
4. Create a private storage bucket named `classroom-files`.
5. Make yourself admin: `insert into admin_users(user_id) values ('<your-user-id>'); update profiles set role='admin' where id='<your-user-id>';`
6. Optional: set `LOVABLE_API_KEY` as a server secret to enable the AI mentor and quiz grading.

## Deploying

- **Lovable:** click Publish.
- **Vercel:** import the repo, add the `VITE_SUPABASE_*` and `SUPABASE_*` variables from `.env.example`, and deploy (the Nitro Vercel preset is configured in `vite.config.ts`).
- **Cloudflare Workers:** `bun run build` and deploy the output with Wrangler.

---

See [CONTRIBUTING.md](CONTRIBUTING.md) to get involved.

## Security & privacy

- Every user-facing table has **Row Level Security enabled** and policies scoped to `auth.uid()`.
- Admin roles live in a separate `admin_users` table (never on `profiles`) to prevent privilege escalation.
- `profiles_guard_privileged_columns` trigger blocks any client-side attempt to change `role`, `is_suspended` or `current_streak`.
- Passwords are handled by Supabase Auth and are never stored or logged by the app.
- Journal entries are strictly per-user; no admin read access.

---

## License

MIT — free for any student, teacher, school, or nonprofit to use, fork, and improve.

---

*"The beautiful thing about learning is that no one can take it away from you." — B.B. King*
