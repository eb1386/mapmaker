# Self Care Map

Interactive self-care map of Vancouver powered by Supabase and MapLibre GL. Displays curated locations on an elegant map with photo galleries, audio, and descriptive text.

## Prerequisites

- Node.js 18+
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (installed via `npx supabase`)
- Docker (for local Supabase development)

## Quick Start

```bash
# install dependencies
npm install

# copy env and configure
cp .env.example .env
# edit .env with your Supabase URL and anon key

# start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (local: `http://127.0.0.1:54321`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## Supabase Local Development

```bash
# start local supabase (requires Docker)
npm run db:start

# apply migrations and seed data
npm run db:reset

# generate TypeScript types from local schema
npm run db:types

# stop local supabase
npm run db:stop
```

After starting local Supabase, update `.env`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from supabase start output>
```

## Supabase Remote Setup

```bash
# login to Supabase CLI
npx supabase login

# link to remote project
npm run db:link

# push migrations to remote
npm run db:push

# seed remote database (run seed.sql manually via Supabase dashboard SQL editor
# or use: npx supabase db reset --linked)
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset local DB (apply migrations + seed) |
| `npm run db:migrate` | Apply pending migrations locally |
| `npm run db:types` | Generate TypeScript types from local DB |
| `npm run db:link` | Link to remote Supabase project |
| `npm run db:push` | Push migrations to remote Supabase |

## Database Schema

### `locations` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Unique location identifier |
| `name` | text | Display name |
| `coords` | float8[] | [longitude, latitude] |
| `photos` | text[] | Photo paths relative to public/ |
| `fits` | text[] | CSS object-fit per photo |
| `audio` | text | Audio file path |
| `citation` | text | Source citation |
| `body` | text | Description text |
| `sort_order` | integer | Display order |
| `created_at` | timestamptz | Creation timestamp |

Row Level Security is enabled with a public read policy.

## Architecture

See [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) for detailed architecture documentation.

## License

MIT
