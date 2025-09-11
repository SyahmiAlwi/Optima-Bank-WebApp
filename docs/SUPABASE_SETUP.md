Supabase Setup

1. Create a Supabase project at `https://supabase.com`.
2. In Authentication > Providers, enable Email. (Google optional.)
3. Open SQL editor and run the contents of `supabase/seed.sql`.
4. Go to Project Settings > API. Copy the Project URL and anon public key.
5. Create `.env.local` in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

6. Start the app and test:
   - `npm run dev`
   - Visit `/auth`, sign up, then you should be redirected to `/dashboard`.


