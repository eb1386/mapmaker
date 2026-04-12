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
| Remote Supabase link | Blocked | Requires `SUPABASE_ACCESS_TOKEN` - run `npx supabase login` then `npm run db:link` |
| Remote migration push | Blocked | After link - run `npm run db:push` |
| Remote seed | Blocked | After push - run seed SQL via dashboard SQL editor |

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

## Blockers

- **Supabase CLI auth**: Non-TTY environment cannot run interactive `npx supabase login`. Need to set `SUPABASE_ACCESS_TOKEN` env var or run in a terminal. Once authenticated, run:
  1. `npx supabase link --project-ref eydxpgmergsqpsmrzgdf`
  2. `npx supabase db push`
  3. Run `supabase/seed.sql` via Supabase dashboard SQL editor
