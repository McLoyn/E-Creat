# Project Notes

- Stack: React + Vite (`apps/web`), Express + TypeScript + Prisma (`apps/api`), Supabase/PostgreSQL schema ready (`docs/supabase_schema.sql`), Vercel SPA ready (`apps/web/vercel.json`).
- Run dev: `npm run dev` starts the Express backend on `http://127.0.0.1:4000` which also serves the compiled React SPA. Rebuild web with `cd apps/web && npx vite build`.
- Demo users: Admin `admin@ekraftuban.id` / `AdminPassword123!`, Creator `kreator1@ekraftuban.id` / `UserPassword123!`.
