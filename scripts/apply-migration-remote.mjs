#!/usr/bin/env node
// apply migration to remote supabase via management API
// usage: SUPABASE_ACCESS_TOKEN=<token> node scripts/apply-migration-remote.mjs
// get token at: https://supabase.com/dashboard/account/tokens
//
// if no access token, paste the SQL from
// supabase/migrations/20260412100000_multi_user_maps.sql
// into the supabase dashboard sql editor:
// https://supabase.com/dashboard/project/eydxpgmergsqpsmrzgdf/sql/new

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'eydxpgmergsqpsmrzgdf'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!TOKEN) {
  console.log('No SUPABASE_ACCESS_TOKEN found.')
  console.log('')
  console.log('Option 1: Set the token and re-run:')
  console.log('  Get token at: https://supabase.com/dashboard/account/tokens')
  console.log('  SUPABASE_ACCESS_TOKEN=<token> node scripts/apply-migration-remote.mjs')
  console.log('')
  console.log('Option 2: Paste SQL into the dashboard SQL editor:')
  console.log('  https://supabase.com/dashboard/project/eydxpgmergsqpsmrzgdf/sql/new')
  console.log('  File: supabase/migrations/20260412100000_multi_user_maps.sql')
  process.exit(1)
}

async function runSQL(sql, label) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  )
  if (!res.ok) {
    const text = await res.text()
    console.error(`[${label}] failed (${res.status}):`, text)
    return false
  }
  console.log(`[${label}] ok`)
  return true
}

const migration = readFileSync(join(__dirname, '..', 'supabase', 'migrations', '20260412100000_multi_user_maps.sql'), 'utf8')
await runSQL(migration, 'multi-user migration')
