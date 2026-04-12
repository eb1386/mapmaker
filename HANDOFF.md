# Handoff

## Repo Info

- **Local path**: `c:/Users/Evan Borodow/Downloads/selfcare-map`
- **Remote URL**: https://github.com/eb1386/selfcare-map
- **Branch**: `master`
- **Visibility**: Public

## Bootstrap Commands

```bash
git clone https://github.com/eb1386/selfcare-map.git
cd selfcare-map
npm install
cp .env.example .env
# edit .env with Supabase credentials
npm run dev
```

## Required Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase dashboard > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API > anon/public |

## Supabase Remote Setup (One-Time)

The Supabase project ref is `eydxpgmergsqpsmrzgdf`.

```bash
# 1. login (requires Supabase access token)
npx supabase login

# 2. link project
npx supabase link --project-ref eydxpgmergsqpsmrzgdf

# 3. push migrations
npx supabase db push

# 4. seed data (via dashboard SQL editor or)
# copy contents of supabase/seed.sql and run in Supabase SQL editor
```

## Supabase Local Development

Requires Docker running.

```bash
npx supabase start          # start local stack
npx supabase db reset        # apply migrations + seed
npx supabase gen types typescript --local > src/types/database.generated.ts
npx supabase stop            # when done
```

## Remote Database Status

The remote Supabase database is fully set up:
- Migration applied: `locations` table with RLS + public read policy
- Seed data: 4 locations inserted and verified
- The app is ready to use with the remote `.env` values already configured

## Optional Future Steps

1. **Supabase CLI link** (for future migrations): `npx supabase login` then `npx supabase link --project-ref eydxpgmergsqpsmrzgdf`
2. **Deploy to hosting**: Run `npm run build` and deploy `dist/` to Vercel, Netlify, or any static host

## Tech Stack

- Vite + TypeScript (vanilla)
- MapLibre GL JS
- Supabase (PostgreSQL + JS client)
- Static assets (photos, audio) in `public/`
