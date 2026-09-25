/**
 * Database types, generated from the live project (diplptvvvibnrrntyrap).
 *
 * Regenerate rather than edit, after any migration:
 *
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 *
 * (then put this comment back). The conversations, conversation_members,
 * messages and thread_summaries tables belong to another app in the same
 * project; this site does not use them.
 */

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
  public: {
    Tables: {
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_refresh_runs: {
        Row: {
          finished_at: string | null
          id: number
          job: string
          message: string | null
          rows_written: number
          started_at: string
          status: string
        }
        Insert: {
          finished_at?: string | null
          id?: never
          job: string
          message?: string | null
          rows_written?: number
          started_at?: string
          status?: string
        }
        Update: {
          finished_at?: string | null
          id?: never
          job?: string
          message?: string | null
          rows_written?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      live_figures: {
        Row: {
          area: string
          detail: Json | null
          fetched_at: string
          period: string
          series: string
          source: string
          text_value: string | null
          value: number | null
        }
        Insert: {
          area: string
          detail?: Json | null
          fetched_at?: string
          period: string
          series: string
          source: string
          text_value?: string | null
          value?: number | null
        }
        Update: {
          area?: string
          detail?: Json | null
          fetched_at?: string
          period?: string
          series?: string
          source?: string
          text_value?: string | null
          value?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          fetched_at: string
          outlet: string
          places: string[]
          published_at: string
          title: string
          url: string
        }
        Insert: {
          fetched_at?: string
          outlet: string
          places: string[]
          published_at: string
          title: string
          url: string
        }
        Update: {
          fetched_at?: string
          outlet?: string
          places?: string[]
          published_at?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      note_links: {
        Row: {
          created_at: string
          id: string
          note_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_links_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          entity_name: string | null
          entity_type: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
          voice_path: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
          voice_path?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          voice_path?: string | null
        }
        Relationships: []
      }
      pinned_items: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_color: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          email_digest: boolean
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_color?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_digest?: boolean
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_color?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_digest?: boolean
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      thread_summaries: {
        Row: {
          conversation_id: string
          generated_at: string
          generated_by: string
          message_count: number
          summary: string
        }
        Insert: {
          conversation_id: string
          generated_at?: string
          generated_by: string
          message_count: number
          summary: string
        }
        Update: {
          conversation_id?: string
          generated_at?: string
          generated_by?: string
          message_count?: number
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_events: {
        Row: {
          area: string | null
          event_date: string
          fetched_at: string
          id: string
          kind: string
          scope: string
          source: string
          source_url: string
          title: string
        }
        Insert: {
          area?: string | null
          event_date: string
          fetched_at?: string
          id: string
          kind: string
          scope: string
          source: string
          source_url: string
          title: string
        }
        Update: {
          area?: string | null
          event_date?: string
          fetched_at?: string
          id?: string
          kind?: string
          scope?: string
          source?: string
          source_url?: string
          title?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          seen_at: string
          snapshot: Json
          topics: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          seen_at?: string
          snapshot?: Json
          topics?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          seen_at?: string
          snapshot?: Json
          topics?: string[]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      data_refresh_token_ok: { Args: { token: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
