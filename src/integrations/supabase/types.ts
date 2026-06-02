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
      keys: {
        Row: {
          code: string
          created_at: string
          duration: Database["public"]["Enums"]["key_duration"]
          expires_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["key_status"]
          user_associated: string | null
        }
        Insert: {
          code: string
          created_at?: string
          duration: Database["public"]["Enums"]["key_duration"]
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["key_status"]
          user_associated?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          duration?: Database["public"]["Enums"]["key_duration"]
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["key_status"]
          user_associated?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          category: string
          created_at: string
          description: string | null
          discord_user_id: string | null
          id: string
          priority: Database["public"]["Enums"]["report_priority"]
          status: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at: string
          username: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          discord_user_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["report_priority"]
          status?: Database["public"]["Enums"]["report_status"]
          title: string
          updated_at?: string
          username: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          discord_user_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["report_priority"]
          status?: Database["public"]["Enums"]["report_status"]
          title?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      tracker_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          stage: Database["public"]["Enums"]["tracker_stage"]
          tracker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          stage: Database["public"]["Enums"]["tracker_stage"]
          tracker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          stage?: Database["public"]["Enums"]["tracker_stage"]
          tracker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_events_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "trackers"
            referencedColumns: ["id"]
          },
        ]
      }
      trackers: {
        Row: {
          created_at: string
          current_stage: Database["public"]["Enums"]["tracker_stage"]
          id: string
          report_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stage?: Database["public"]["Enums"]["tracker_stage"]
          id?: string
          report_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stage?: Database["public"]["Enums"]["tracker_stage"]
          id?: string
          report_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trackers_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      key_duration: "1d" | "7d" | "15d" | "30d" | "60d" | "90d" | "permanent"
      key_status: "active" | "suspended" | "expired"
      report_priority: "baja" | "media" | "alta" | "critica"
      report_status: "pendiente" | "en_revision" | "resuelto" | "cerrado"
      tracker_stage:
        | "enviado"
        | "recibido"
        | "en_revision"
        | "investigando"
        | "resolucion_aplicada"
        | "finalizado"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      key_duration: ["1d", "7d", "15d", "30d", "60d", "90d", "permanent"],
      key_status: ["active", "suspended", "expired"],
      report_priority: ["baja", "media", "alta", "critica"],
      report_status: ["pendiente", "en_revision", "resuelto", "cerrado"],
      tracker_stage: [
        "enviado",
        "recibido",
        "en_revision",
        "investigando",
        "resolucion_aplicada",
        "finalizado",
      ],
    },
  },
} as const
