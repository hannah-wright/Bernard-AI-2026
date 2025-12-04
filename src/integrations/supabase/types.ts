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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          stripe_payment_id: string | null
          stripe_subscription_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          stripe_payment_id?: string | null
          stripe_subscription_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string | null
          id: string
          name: string
          startup_id: string
          url: string | null
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string | null
          id?: string
          name: string
          startup_id: string
          url?: string | null
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string | null
          id?: string
          name?: string
          startup_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          startup_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          startup_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          startup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_rounds: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          lead_investors: string[] | null
          round_type: Database["public"]["Enums"]["round_type"]
          startup_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          lead_investors?: string[] | null
          round_type: Database["public"]["Enums"]["round_type"]
          startup_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          lead_investors?: string[] | null
          round_type?: Database["public"]["Enums"]["round_type"]
          startup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_rounds_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          credits_granted: number
          expires_at: string | null
          id: string
          max_uses: number | null
          times_used: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          credits_granted?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          credits_granted?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number | null
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          id: string
          invite_code_id: string
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          invite_code_id: string
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          invite_code_id?: string
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits_remaining: number | null
          email: string | null
          full_name: string | null
          id: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits_remaining?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits_remaining?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_filters: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      startups: {
        Row: {
          buzz_score: number | null
          city: string
          country: string
          created_at: string | null
          description: string
          eli5: string
          estimated_revenue: string | null
          estimated_size: string | null
          id: string
          logo: string | null
          name: string
          sectors: Database["public"]["Enums"]["sector_type"][]
          state: string | null
          updated_at: string | null
          website: string
        }
        Insert: {
          buzz_score?: number | null
          city: string
          country: string
          created_at?: string | null
          description: string
          eli5: string
          estimated_revenue?: string | null
          estimated_size?: string | null
          id?: string
          logo?: string | null
          name: string
          sectors?: Database["public"]["Enums"]["sector_type"][]
          state?: string | null
          updated_at?: string | null
          website: string
        }
        Update: {
          buzz_score?: number | null
          city?: string
          country?: string
          created_at?: string | null
          description?: string
          eli5?: string
          estimated_revenue?: string | null
          estimated_size?: string | null
          id?: string
          logo?: string | null
          name?: string
          sectors?: Database["public"]["Enums"]["sector_type"][]
          state?: string | null
          updated_at?: string | null
          website?: string
        }
        Relationships: []
      }
      user_alerts: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          is_active: boolean | null
          name: string
          notification_email: boolean | null
          notification_slack: boolean | null
          slack_webhook: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters: Json
          id?: string
          is_active?: boolean | null
          name: string
          notification_email?: boolean | null
          notification_slack?: boolean | null
          slack_webhook?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          notification_email?: boolean | null
          notification_slack?: boolean | null
          slack_webhook?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      confidence_level: "verified" | "high" | "medium" | "low"
      round_type:
        | "Pre-Seed"
        | "Seed"
        | "Series A"
        | "Series B"
        | "Series C"
        | "Series D+"
      sector_type:
        | "AI/ML"
        | "Fintech"
        | "Healthcare"
        | "SaaS"
        | "E-commerce"
        | "Biotech"
        | "Climate Tech"
        | "Enterprise"
        | "Consumer"
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
      app_role: ["admin", "user"],
      confidence_level: ["verified", "high", "medium", "low"],
      round_type: [
        "Pre-Seed",
        "Seed",
        "Series A",
        "Series B",
        "Series C",
        "Series D+",
      ],
      sector_type: [
        "AI/ML",
        "Fintech",
        "Healthcare",
        "SaaS",
        "E-commerce",
        "Biotech",
        "Climate Tech",
        "Enterprise",
        "Consumer",
      ],
    },
  },
} as const
