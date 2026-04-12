export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string
          name: string
          coords: [number, number]
          photos: string[]
          fits: string[]
          audio: string | null
          citation: string | null
          body: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          coords: [number, number]
          photos: string[]
          fits?: string[]
          audio?: string | null
          citation?: string | null
          body: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Location = Database['public']['Tables']['locations']['Row']
