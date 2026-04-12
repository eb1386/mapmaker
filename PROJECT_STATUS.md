# Project Status

## Phase 1 - New Repo Creation

| Step | Status | Notes |
|------|--------|-------|
| Source repo inspected | Done | Vanilla HTML/CSS/JS, MapLibre GL, static JSON data |
| New Vite + TS project created | Done | `c:/Users/Evan Borodow/Downloads/selfcare-map` |
| Dependencies installed | Done | maplibre-gl, @supabase/supabase-js |
| App code migrated to TypeScript | Done | main.ts, locations.ts, supabase.ts, types |
| Static assets copied | Done | img/ and audio/ in public/ |
| Build passes | Done | `npm run build` succeeds |
| Typecheck passes | Done | `tsc --noEmit` clean |

## Phase 2 - Supabase Setup

| Step | Status | Notes |
|------|--------|-------|
| Supabase CLI available | Done | via npx |
| Supabase initialized in repo | Done | `supabase/config.toml` |
| Migration created | Done | `20260412000000_create_locations.sql` |
| Seed data created | Done | `supabase/seed.sql` |
| RLS enabled + public read policy | Done | In migration |
| Remote .env configured | Done | Points to eydxpgmergsqpsmrzgdf project |
| Remote migration applied | Done | `locations` table exists with RLS + public read policy |
| Remote seed data | Done | 4 locations inserted via REST API with service_role key |
| Remote data verified | Done | Anon key query returns all 4 locations ordered by sort_order |

## Phase 3 - Harden & Ship

| Step | Status | Notes |
|------|--------|-------|
| GitHub repo created | Done | https://github.com/eb1386/selfcare-map (public) |
| Code pushed | Done | master branch |
| README finalized | Done | Full setup + Supabase docs |
| HANDOFF finalized | Done | Bootstrap + remote commands |
| ARCHITECTURE_NOTES finalized | Done | Source analysis + new arch |
| LICENSE added | Done | MIT |
| Boilerplate cleaned | Done | Removed unused Vite scaffold files |

## Remote Database Status

- Migration: applied (table `locations` with RLS)
- Seed: 4 locations inserted (stanley-park, lucky-fortune, kerrisdale, pacific-spirit-park)
- Verified: anon key REST query returns all data correctly
- RLS: public read policy active, write blocked from client

## Optional: Supabase CLI Link

For future migration management via CLI:
1. `npx supabase login` (requires personal access token from https://supabase.com/dashboard/account/tokens)
2. `npx supabase link --project-ref eydxpgmergsqpsmrzgdf`
3. `npx supabase db push` (for future migrations)
