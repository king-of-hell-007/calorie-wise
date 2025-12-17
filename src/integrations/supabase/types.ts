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
      admin_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          error_count: number
          id: string
          is_active: boolean
          key_name: string
          key_value: string
          last_error_at: string | null
          last_used_at: string | null
          provider: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_count?: number
          id?: string
          is_active?: boolean
          key_name: string
          key_value: string
          last_error_at?: string | null
          last_used_at?: string | null
          provider?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_count?: number
          id?: string
          is_active?: boolean
          key_name?: string
          key_value?: string
          last_error_at?: string | null
          last_used_at?: string | null
          provider?: string
          usage_count?: number
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          name: string
          points: number
          rule_json: Json
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          name: string
          points?: number
          rule_json: Json
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          points?: number
          rule_json?: Json
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          analyzer_json: Json
          confidence: number | null
          created_at: string
          id: string
          image_url: string | null
          meal_slot: Database["public"]["Enums"]["meal_slot"]
          notes: string | null
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          user_id: string
        }
        Insert: {
          analyzer_json: Json
          confidence?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          meal_slot: Database["public"]["Enums"]["meal_slot"]
          notes?: string | null
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
          user_id: string
        }
        Update: {
          analyzer_json?: Json
          confidence?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          meal_slot?: Database["public"]["Enums"]["meal_slot"]
          notes?: string | null
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          carbs_g: number
          created_at: string
          daily_target_calories: number
          fat_g: number
          id: string
          is_active: boolean
          plan_json: Json
          protein_g: number
          tolerance_percent: number
          user_id: string
        }
        Insert: {
          carbs_g: number
          created_at?: string
          daily_target_calories: number
          fat_g: number
          id?: string
          is_active?: boolean
          plan_json: Json
          protein_g: number
          tolerance_percent?: number
          user_id: string
        }
        Update: {
          carbs_g?: number
          created_at?: string
          daily_target_calories?: number
          fat_g?: number
          id?: string
          is_active?: boolean
          plan_json?: Json
          protein_g?: number
          tolerance_percent?: number
          user_id?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          baseline_activity:
            | Database["public"]["Enums"]["baseline_activity"]
            | null
          bmi: number | null
          bmr: number | null
          carbs_g: number | null
          created_at: string
          current_streak_days: number
          dietary_preferences: string | null
          email: string | null
          exercise_duration:
            | Database["public"]["Enums"]["exercise_duration"]
            | null
          exercise_frequency:
            | Database["public"]["Enums"]["exercise_frequency"]
            | null
          fat_g: number | null
          goal: Database["public"]["Enums"]["goal_type"] | null
          goal_custom_text: string | null
          height_cm: number | null
          id: string
          last_log_date: string | null
          longest_streak_days: number
          onboarding_completed: boolean
          protein_g: number | null
          sex: Database["public"]["Enums"]["user_sex"] | null
          target_calories: number | null
          tdee: number | null
          total_points: number
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          baseline_activity?:
            | Database["public"]["Enums"]["baseline_activity"]
            | null
          bmi?: number | null
          bmr?: number | null
          carbs_g?: number | null
          created_at?: string
          current_streak_days?: number
          dietary_preferences?: string | null
          email?: string | null
          exercise_duration?:
            | Database["public"]["Enums"]["exercise_duration"]
            | null
          exercise_frequency?:
            | Database["public"]["Enums"]["exercise_frequency"]
            | null
          fat_g?: number | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          goal_custom_text?: string | null
          height_cm?: number | null
          id: string
          last_log_date?: string | null
          longest_streak_days?: number
          onboarding_completed?: boolean
          protein_g?: number | null
          sex?: Database["public"]["Enums"]["user_sex"] | null
          target_calories?: number | null
          tdee?: number | null
          total_points?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          baseline_activity?:
            | Database["public"]["Enums"]["baseline_activity"]
            | null
          bmi?: number | null
          bmr?: number | null
          carbs_g?: number | null
          created_at?: string
          current_streak_days?: number
          dietary_preferences?: string | null
          email?: string | null
          exercise_duration?:
            | Database["public"]["Enums"]["exercise_duration"]
            | null
          exercise_frequency?:
            | Database["public"]["Enums"]["exercise_frequency"]
            | null
          fat_g?: number | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          goal_custom_text?: string | null
          height_cm?: number | null
          id?: string
          last_log_date?: string | null
          longest_streak_days?: number
          onboarding_completed?: boolean
          protein_g?: number | null
          sex?: Database["public"]["Enums"]["user_sex"] | null
          target_calories?: number | null
          tdee?: number | null
          total_points?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      baseline_activity:
        | "sedentary"
        | "mild"
        | "moderate"
        | "heavy"
        | "very_heavy"
      exercise_duration:
        | "15_30_min"
        | "30_60_min"
        | "60_120_min"
        | "120_plus_min"
      exercise_frequency: "never" | "rarely" | "regularly" | "daily"
      goal_type:
        | "lose_weight"
        | "gain_weight"
        | "maintain"
        | "recomposition"
        | "custom"
      meal_slot: "breakfast" | "lunch" | "dinner" | "snack"
      user_sex: "male" | "female" | "prefer_not_to_say"
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
      baseline_activity: [
        "sedentary",
        "mild",
        "moderate",
        "heavy",
        "very_heavy",
      ],
      exercise_duration: [
        "15_30_min",
        "30_60_min",
        "60_120_min",
        "120_plus_min",
      ],
      exercise_frequency: ["never", "rarely", "regularly", "daily"],
      goal_type: [
        "lose_weight",
        "gain_weight",
        "maintain",
        "recomposition",
        "custom",
      ],
      meal_slot: ["breakfast", "lunch", "dinner", "snack"],
      user_sex: ["male", "female", "prefer_not_to_say"],
    },
  },
} as const
