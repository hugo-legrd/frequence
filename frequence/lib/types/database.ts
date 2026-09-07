export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artists: {
        Row: {
          genres: string[] | null
          id: string
          image_url: string | null
          last_fm_id: string | null
          name: string | null
        }
        Insert: {
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_fm_id?: string | null
          name?: string | null
        }
        Update: {
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_fm_id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      event_genres: {
        Row: {
          event_id: string
          genre_id: string
        }
        Insert: {
          event_id: string
          genre_id: string
        }
        Update: {
          event_id?: string
          genre_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_genres_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          artist_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string | null
          source: string | null
          starts_at: string | null
          style: string[] | null
          ticket_link: string | null
          venue_id: string | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string | null
          source?: string | null
          starts_at?: string | null
          style?: string[] | null
          ticket_link?: string | null
          venue_id?: string | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string | null
          source?: string | null
          starts_at?: string | null
          style?: string[] | null
          ticket_link?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      genre_slug_map: {
        Row: {
          genre_name: string
          slug: string
        }
        Insert: {
          genre_name: string
          slug: string
        }
        Update: {
          genre_name?: string
          slug?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          id: string
          name: string | null
        }
        Insert: {
          id?: string
          name?: string | null
        }
        Update: {
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string | null
          event_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      record_stores: {
        Row: {
          address: string | null
          google_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          schedule: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          schedule?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          google_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          schedule?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_genres: {
        Row: {
          genre_id: string
          user_id: string
        }
        Insert: {
          genre_id: string
          user_id: string
        }
        Update: {
          genre_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          email: string | null
          favorite_genres: string[] | null
          handle: string | null
          id: string
          name: string | null
          profile_visibility: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          favorite_genres?: string[] | null
          handle?: string | null
          id: string
          name?: string | null
          profile_visibility?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          favorite_genres?: string[] | null
          handle?: string | null
          id?: string
          name?: string | null
          profile_visibility?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_user: { Args: { target: string }; Returns: boolean }
      get_all_genres_with_selection: {
        Args: { current_user_id: string }
        Returns: {
          id: string
          name: string
          selected: boolean
        }[]
      }
      get_friends_activity: {
        Args: { current_user_id: string; limit_count?: number }
        Returns: {
          actor_display_name: string
          actor_id: string
          artist_name: string
          created_at: string
          event_id: string
          event_name: string
          starts_at: string
          status: string
          venue_name: string
        }[]
      }
      get_friends_going: {
        Args: { current_user_id: string; target_event_id: string }
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
      get_home_friends_pick: {
        Args: { current_user_id: string }
        Returns: {
          artist_name: string
          event_id: string
          event_name: string
          friend_names: string[]
          friends_count: number
          venue_name: string
        }[]
      }
      get_mutual_friends: {
        Args: {
          current_user_id: string
          limit_count?: number
          target_user_id: string
        }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      get_mutual_friends_count: {
        Args: { current_user_id: string; target_user_id: string }
        Returns: number
      }
      get_my_artists: {
        Args: { current_user_id: string }
        Returns: {
          artist_id: string
          artist_name: string
          events_count: number
          image_url: string
        }[]
      }
      get_my_events: {
        Args: { current_user_id: string }
        Returns: {
          artist_name: string
          event_id: string
          event_name: string
          image_url: string
          is_past: boolean
          starts_at: string
          status: string
          style: string[]
          venue_name: string
        }[]
      }
      get_my_profile: {
        Args: { current_user_id: string }
        Returns: {
          artists_count: number
          avatar_url: string
          city: string
          concerts_count: number
          display_name: string
          follower_count: number
          following_count: number
          genres: Json
          id: string
          member_since: string
        }[]
      }
      get_public_profile: {
        Args: { current_user_id: string; target_user_id: string }
        Returns: {
          display_name: string
          followers_count: number
          following_count: number
          id: string
          is_following: boolean
        }[]
      }
      get_random_upcoming_event: {
        Args: never
        Returns: {
          artist_name: string
          event_id: string
          event_name: string
          genre_names: string[]
          image_url: string
          starts_at: string
          venue_name: string
        }[]
      }
      search_all: { Args: { query: string }; Returns: Json }
      search_users: {
        Args: { current_user_id: string; search_term: string }
        Returns: {
          display_name: string
          handle: string
          id: string
          is_following: boolean
        }[]
      }
      sync_event_genres: { Args: { p_event_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
