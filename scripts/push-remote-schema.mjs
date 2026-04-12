#!/usr/bin/env node
// push schema and seed to remote supabase
// usage: SUPABASE_ACCESS_TOKEN=<token> node scripts/push-remote-schema.mjs

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_REF = 'eydxpgmergsqpsmrzgdf'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!TOKEN) {
  console.error('Set SUPABASE_ACCESS_TOKEN env var first.')
  console.error('Get one at: https://supabase.com/dashboard/account/tokens')
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

const migration = readFileSync(join(__dirname, '..', 'supabase', 'migrations', '20260412000000_create_locations.sql'), 'utf8')
const seed = readFileSync(join(__dirname, '..', 'supabase', 'seed.sql'), 'utf8')

const ok1 = await runSQL(migration, 'migration')
if (ok1) await runSQL(seed, 'seed')
