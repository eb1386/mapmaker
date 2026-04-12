// data access layer
import { supabase } from './supabase'
import type { MapRow, MapLocation } from './types/database'

// maps
export async function fetchUserMaps(userId: string): Promise<MapRow[]> {
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []) as MapRow[]
}

export async function fetchMapBySlug(slug: string): Promise<MapRow | null> {
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as MapRow | null
}

export async function createMap(map: Partial<MapRow> & { user_id: string; slug: string; title: string }): Promise<MapRow> {
  const { data, error } = await supabase
    .from('maps')
    .insert(map)
    .select()
    .single()
  if (error) throw error
  return data as MapRow
}

export async function updateMap(id: string, updates: Partial<MapRow>): Promise<MapRow> {
  const { data, error } = await supabase
    .from('maps')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MapRow
}

export async function deleteMap(id: string) {
  const { error } = await supabase.from('maps').delete().eq('id', id)
  if (error) throw error
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const { data } = await supabase
    .from('maps')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return !data
}

// locations
export async function fetchMapLocations(mapId: string): Promise<MapLocation[]> {
  const { data, error } = await supabase
    .from('map_locations')
    .select('*')
    .eq('map_id', mapId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data || []) as MapLocation[]
}

export async function createLocation(loc: Partial<MapLocation> & { map_id: string; lng: number; lat: number }): Promise<MapLocation> {
  const { data, error } = await supabase
    .from('map_locations')
    .insert(loc)
    .select()
    .single()
  if (error) throw error
  return data as MapLocation
}

export async function updateLocation(id: string, updates: Partial<MapLocation>): Promise<MapLocation> {
  const { data, error } = await supabase
    .from('map_locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as MapLocation
}

export async function deleteLocation(id: string) {
  const { error } = await supabase.from('map_locations').delete().eq('id', id)
  if (error) throw error
}

// storage uploads
export async function uploadPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadAudio(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'mp3'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('audio').upload(path, file, { contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('audio').getPublicUrl(path)
  return data.publicUrl
}
