# CreaVerse — Education for Everyone

> **Learn, Visualize, and Build Things.**
> A Pakistan-first, open-source learning universe for students, teachers, and creators — with AI mentorship, live classrooms, immersive VR lessons, an opportunity hub, and predictive analytics.

---

## The story behind CreaVerse

CreaVerse was not built inside a Silicon Valley co-working space. It was built by a student from **Dera Ghazi Khan**, a small city in southern Punjab, Pakistan — a place where quality education is more of a rumor than a reality for most children.

For years I watched brilliant classmates lose the game not because they lacked intelligence, but because the system rewards **rote learning over understanding**. You memorize a paragraph, you write it back, you pass. You never see the atom. You never build the circuit. You never ask *why*.

I got lucky. On merit, I earned a seat at a **Daanish school** — a government-backed institution that gives high-quality residential education to talented students from underprivileged backgrounds. Sitting in a real lab for the first time, with real teachers and real books, I realized how enormous the gap was between what education *could* be and what it usually *is* for millions of Pakistani children — especially in villages, out-of-school populations, and low-income urban families.

CreaVerse is my answer to that gap.

It is a **full-stack, open, free-to-use learning platform** designed for the students who don't have access to expensive tutors, elite schools, or foreign apps that never spoke their language. It brings together:

- **An AI mentor** that explains things patiently, in plain words, and remembers what you've asked before — so a child in a village has the same 24/7 tutor as a child in a private school.
- **A real classroom system** with live chat, so a teacher anywhere in the country can run an actual class, share assignments, and message students in realtime.
- **Cardboard-VR science lessons** so students can *see* gravity, atoms, and circuits — because a two-rupee cardboard viewer plus a phone is a science lab we can actually afford.
- **An opportunity hub** that surfaces scholarships, competitions, and internships that most students never hear about.
- **A daily journal, water tracker, streaks, and analytics** — because learning is a habit, not an event.

It is built to run on a low-end Android phone with a bad signal, and it is built to stay free.

**— The Founder, from Dera Ghazi Khan to the rest of Pakistan.**

---

## Highlights

- 🧠 **AI Mentor** — persistent, personalized, patient. Powered by Lovable AI Gateway.
- 🏫 **Live Classrooms** — teacher-created classes with realtime chat and direct messages.
- 🥽 **VR Science Lab** — Cardboard-ready stereo view for a curated set of embeddable science videos, plus a partner tool (**Mathify**) for custom visualizations.
- 🎯 **Opportunity Hub, Contests, Academy** — curated free content and pathways.
- 📓 **Daily Journal** — mood, self-assessment, water intake, private-to-you reflections.
- 📈 **Predictive Analytics** — success score, at-risk detection, per-class weak-area surfacing.
- 🔐 **Real authentication** — email / password, phone OTP (SMS), and Google OAuth.
- 📱 **Installable PWA** — works on low-end Android, with offline read-caching for static pages.
- 🌍 **Built for Pakistan first, the world next.**

---

## Tech stack

- **Frontend:** React 19, TanStack Start v1 (file-based routing + server functions), TanStack Query, Tailwind CSS v4.
- **Backend:** Lovable Cloud (Supabase-managed) — Postgres with strict RLS, Auth, Realtime, Storage, Edge functions.
- **AI:** Lovable AI Gateway (chat completions, retrieval, embeddings).
- **Deployment:** Cloudflare Workers via Lovable's managed pipeline.
- **Design system:** Editorial ivory + deep-ink navy + amber accent. Semantic tokens only; dark-mode ready.

---

## Repository layout

```
src/
├── routes/               # File-based routes (TanStack Start)
│   ├── __root.tsx        # App shell, head metadata, service worker guard
│   ├── index.tsx         # Landing page
│   ├── auth.tsx          # Sign in / Sign up (email, phone OTP, Google)
│   ├── student.*.tsx     # Student dashboard & classes
│   ├── teacher.*.tsx     # Teacher dashboard & class management
│   ├── admin.dashboard   # Admin console
│   ├── mentor.tsx        # AI mentor chat
│   ├── vr.tsx            # Cardboard VR lab
│   ├── journal.tsx       # Daily journal + water tracker
│   ├── opportunities.tsx # Opportunity hub
│   └── ...
├── components/           # Presentational + shared UI
├── hooks/                # useAuth, useDraft, useConfirm, use-mobile
├── lib/                  # brand config, static content, server functions
└── integrations/supabase # Auto-generated client & types
```

Never edit `src/routeTree.gen.ts` or any file under `src/integrations/supabase/` — those are managed by the build.

---

## Local development

This project runs on Lovable Cloud. To develop it locally:

```bash
bun install
bun run dev
```

Environment variables are auto-provisioned. See `.env` for the public keys.

---

## Security & privacy

- Every user-facing table has **Row Level Security enabled** and policies scoped to `auth.uid()`.
- Admin roles live in a separate `admin_users` table (never on `profiles`) to prevent privilege escalation.
- `profiles_guard_privileged_columns` trigger blocks any client-side attempt to change `role` or `is_suspended`.
- Password reset uses Supabase's native flow; passwords are never stored or logged by the app.
- Journal entries are strictly per-user; no admin read access.

---

## License

MIT — free for any student, teacher, school, or nonprofit to use, fork, and improve.

---

*"The beautiful thing about learning is that no one can take it away from you." — B.B. King*
