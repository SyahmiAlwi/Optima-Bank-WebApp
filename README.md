Optima-Bank-WebApp - Auth Shell

## Deployment Status
- ✅ Fixed TypeScript errors
- ✅ Ready for production

Stack: Next.js App Router (TypeScript), Tailwind CSS, shadcn/ui, Supabase, react-hook-form, zod.

Getting Started

1) Install deps
```bash
npm i
```

2) Supabase
- Create a project and enable Email auth (Google optional)
- Run `supabase/seed.sql` in SQL editor
- Copy Project URL and anon public key into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
More details in `docs/SUPABASE_SETUP.md`.

3) Develop
```bash
npm run dev
```
Visit `/auth`, sign up, then you’ll be redirected to `/dashboard`.

Notes
- Minimal banking feel, smooth overlay animation.
- Vercel-friendly defaults.
