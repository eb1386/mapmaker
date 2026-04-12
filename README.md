# selfcaremap

Create beautiful interactive maps of places you love. Sign up, pick a custom URL, drop pins on any city, add photos, audio, and descriptions.

## Features

- **User accounts** - sign up with email/password, get a personal dashboard
- **Custom URLs** - every map gets a unique URL like `yoursite.com/my-map`
- **Any city** - search for any city or navigate the map to find your spot
- **Add pins** - click to place pins, drag to reposition
- **Photo galleries** - upload multiple photos per pin with crossfade transitions
- **Audio** - upload MP3s that auto-play when a pin is selected
- **Color themes** - 8 preset color schemes or pick custom colors
- **Text editing** - name, description, and citation for every pin
- **Public maps** - anyone with the URL can view your map
- **Mobile responsive** - works on desktop and mobile with adapted layouts

## Quick Start

```bash
npm install
cp .env.example .env
# edit .env with your Supabase credentials
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## Database

The app uses Supabase (PostgreSQL) with these tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to auth (username, display name) |
| `maps` | User maps with slug, title, position, color scheme |
| `map_locations` | Pins on each map (coords, photos, audio, text) |

Storage buckets: `photos` and `audio` (both public).

Row Level Security: public read for maps/locations, owner-only write.

## Supabase Setup

### Local Development (requires Docker)

```bash
npm run db:start     # start local supabase
npm run db:reset     # apply migrations + seed
npm run db:stop      # stop when done
```

### Remote

```bash
npx supabase login
npm run db:link      # link to remote project
npm run db:push      # push migrations
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset local DB (migrations + seed) |
| `npm run db:link` | Link to remote Supabase project |
| `npm run db:push` | Push migrations to remote |

## Tech Stack

- Vite + TypeScript (vanilla, no framework)
- MapLibre GL JS
- Supabase (PostgreSQL, Auth, Storage)
- Nominatim (city search geocoding)
- CARTO Voyager basemap tiles

## Deploy

Build and deploy `dist/` to any static host. The `public/_redirects` file handles SPA routing on Netlify.

```bash
npm run build
# deploy dist/ folder
```

## License

MIT
