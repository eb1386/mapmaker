// auth helpers
import { supabase } from './supabase'
import type { Profile } from './types/database'

let cachedProfile: Profile | null = null

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function getProfile(): Promise<Profile | null> {
  if (cachedProfile) return cachedProfile
  const user = await getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (data) cachedProfile = data as Profile
  return cachedProfile
}

export function clearProfileCache() {
  cachedProfile = null
}

export async function signUp(email: string, password: string, username: string) {
  // check username
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  if (existing) throw new Error('Username already taken')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.toLowerCase() }
    }
  })
  if (error) throw error
  clearProfileCache()
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  clearProfileCache()
  return data
}

export async function signOut() {
  clearProfileCache()
  await supabase.auth.signOut()
}

export function onAuthChange(cb: (loggedIn: boolean) => void) {
  supabase.auth.onAuthStateChange((_event, session) => {
    clearProfileCache()
    cb(!!session)
  })
}
