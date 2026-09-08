/**
 * Database types for the schema in supabase/migrations.
 *
 * Hand-written to match that migration, because generating them needs a live
 * project and this session could not authenticate. Once the project is linked,
 * regenerate rather than edit:
 *
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 *
 * Regenerating is what keeps these honest: hand-written types drift from the
 * schema silently, and a wrong type here compiles fine and fails at runtime.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          email: string | null;
          avatar_color: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          email?: string | null;
          avatar_color?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          email?: string | null;
          avatar_color?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          context_type: string | null;
          context_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          context_type?: string | null;
          context_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          context_type?: string | null;
          context_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      note_links: {
        Row: {
          id: string;
          note_id: string;
          user_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          user_id: string;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          user_id?: string;
          url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      pinned_items: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: string;
          entity_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: string;
          entity_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
