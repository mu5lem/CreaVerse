# Contributing to CreaVerse

Thanks for helping make free education better!

1. Fork the repo and create a branch: `git checkout -b feature/my-change`.
2. Install and run: `bun install && bun run dev`.
3. Keep changes focused. Use semantic design tokens from `src/styles.css` (no hard-coded colors).
4. Never edit `src/routeTree.gen.ts` or files in `src/integrations/supabase/` — they are generated.
5. Database changes go in a new SQL file under `supabase/migrations/`, with RLS policies and GRANTs.
6. Never commit secrets. Only publishable keys may appear in `.env`.
7. Run `bun run build` before opening a pull request, and describe what and why.

Be kind and respectful — this project exists for students.
