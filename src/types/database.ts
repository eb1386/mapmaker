export interface Profile {
  id: string
  username: string
  display_name: string | null
  created_at: string
}

export interface MapRow {
  id: string
  user_id: string
  slug: string
  title: string
  description: string | null
  center_lng: number
  center_lat: number
  zoom: number
  color_accent: string
  color_accent_deep: string
  color_accent_soft: string
  color_bg: string
  color_ink: string
  is_public: boolean
  stamp_x: number
  stamp_y: number
  show_heart: boolean
  created_at: string
  updated_at: string
}

export interface MapLocation {
  id: string
  map_id: string
  name: string
  lng: number
  lat: number
  photos: string[]
  fits: string[]
  audio: string | null
  citation: string | null
  body: string
  sort_order: number
  created_at: string
}

export interface ColorScheme {
  accent: string
  accentDeep: string
  accentSoft: string
  bg: string
  ink: string
}

export function colorsFromMap(m: MapRow): ColorScheme {
  return {
    accent: m.color_accent,
    accentDeep: m.color_accent_deep,
    accentSoft: m.color_accent_soft,
    bg: m.color_bg,
    ink: m.color_ink
  }
}

export function colorsToMap(c: ColorScheme) {
  return {
    color_accent: c.accent,
    color_accent_deep: c.accentDeep,
    color_accent_soft: c.accentSoft,
    color_bg: c.bg,
    color_ink: c.ink
  }
}

export const DEFAULT_COLORS: ColorScheme = {
  accent: '#E8556B',
  accentDeep: '#C8364C',
  accentSoft: '#F8C9D2',
  bg: '#FBF6F1',
  ink: '#2A1F1A'
}

export const COLOR_PRESETS: { name: string; colors: ColorScheme }[] = [
  { name: 'rose', colors: { accent: '#E8556B', accentDeep: '#C8364C', accentSoft: '#F8C9D2', bg: '#FBF6F1', ink: '#2A1F1A' } },
  { name: 'ocean', colors: { accent: '#3B82F6', accentDeep: '#1D4ED8', accentSoft: '#BFDBFE', bg: '#F0F7FF', ink: '#1E293B' } },
  { name: 'forest', colors: { accent: '#22C55E', accentDeep: '#15803D', accentSoft: '#BBF7D0', bg: '#F0FDF4', ink: '#1A2E1A' } },
  { name: 'sunset', colors: { accent: '#F59E0B', accentDeep: '#D97706', accentSoft: '#FDE68A', bg: '#FFFBEB', ink: '#2A1F0A' } },
  { name: 'violet', colors: { accent: '#8B5CF6', accentDeep: '#6D28D9', accentSoft: '#DDD6FE', bg: '#F5F3FF', ink: '#1E1B3A' } },
  { name: 'slate', colors: { accent: '#64748B', accentDeep: '#475569', accentSoft: '#CBD5E1', bg: '#F8FAFC', ink: '#0F172A' } },
  { name: 'coral', colors: { accent: '#FB7185', accentDeep: '#E11D48', accentSoft: '#FECDD3', bg: '#FFF1F2', ink: '#2A1A1E' } },
  { name: 'teal', colors: { accent: '#14B8A6', accentDeep: '#0D9488', accentSoft: '#99F6E4', bg: '#F0FDFA', ink: '#1A2A28' } },
]
