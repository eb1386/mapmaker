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

## Remaining Manual Steps

1. **Supabase CLI auth**: Run `npx supabase login` with a valid access token to link and push migrations to the remote project
2. **Seed remote DB**: After pushing migrations, run the seed SQL via Supabase dashboard SQL editor or `npx supabase db reset --linked`
3. **Verify remote**: After seeding, open the app with remote `.env` values and confirm locations load from Supabase

## Tech Stack

- Vite + TypeScript (vanilla)
- MapLibre GL JS
- Supabase (PostgreSQL + JS client)
- Static assets (photos, audio) in `public/`
