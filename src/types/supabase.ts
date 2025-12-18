export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      anonymous_usage: {
        Row: {
          created_at: string | null
          ip_address: unknown
          last_request: string | null
          request_count: number | null
        }
        Insert: {
          created_at?: string | null
          ip_address: unknown
          last_request?: string | null
          request_count?: number | null
        }
        Update: {
          created_at?: string | null
          ip_address?: unknown
          last_request?: string | null
          request_count?: number | null
        }
        Relationships: []
      }
      feature_interest_clicks: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          ip_address: string | null
          timestamp: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          ip_address?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          admin_user_id: string | null
          category: string
          created_at: string | null
          email: string | null
          id: string
          ip_address: unknown
          message: string | null
          rating: number
          resolved_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          usage_log_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_user_id?: string | null
          category: string
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          rating: number
          resolved_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          usage_log_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_user_id?: string | null
          category?: string
          created_at?: string | null
          email?: string | null
          id?: string
          ip_address?: unknown
          message?: string | null
          rating?: number
          resolved_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          usage_log_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_usage_log_id_fkey"
            columns: ["usage_log_id"]
            isOneToOne: false
            referencedRelation: "usage_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          action: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          platform: string | null
          processing_time_ms: number | null
          status: string | null
          transcript_length: number | null
          user_id: string | null
          video_url: string
        }
        Insert: {
          action: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          platform?: string | null
          processing_time_ms?: number | null
          status?: string | null
          transcript_length?: number | null
          user_id?: string | null
          video_url: string
        }
        Update: {
          action?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          platform?: string | null
          processing_time_ms?: number | null
          status?: string | null
          transcript_length?: number | null
          user_id?: string | null
          video_url?: string
        }
        Relationships: []
      }
      user_history: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          summary: string | null
          thumbnail_url: string | null
          title: string | null
          transcript: string | null
          updated_at: string | null
          user_id: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          created_at: string | null
          last_reset: string | null
          summary_count: number | null
          transcript_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          last_reset?: string | null
          summary_count?: number | null
          transcript_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          last_reset?: string | null
          summary_count?: number | null
          transcript_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_anonymous_usage_limit: {
        Args: {
          p_anonymous_limit?: number
          p_ip_address: string
          p_reset_interval_hours?: number
        }
        Returns: {
          allowed: boolean
          message: string
          remaining_requests: number
        }[]
      }
      check_authenticated_usage_limit: {
        Args: {
          p_daily_limit?: number
          p_reset_interval_hours?: number
          p_user_id: string
        }
        Returns: {
          allowed: boolean
          message: string
          remaining_requests: number
        }[]
      }
      get_feedback: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_direction?: string
          p_rating?: number
          p_status?: string
          p_user_id?: string
        }
        Returns: {
          admin_notes: string
          category: string
          created_at: string
          email: string
          id: string
          message: string
          rating: number
          status: string
          title: string
          updated_at: string
          user_id: string
          user_name: string
        }[]
      }
      get_feedback_stats: {
        Args: never
        Returns: {
          avg_rating: number
          feedback_by_category: Json
          feedback_by_status: Json
          recent_feedback_count: number
          total_feedback: number
        }[]
      }
      increment_anonymous_usage: {
        Args: {
          p_action: string
          p_anonymous_limit?: number
          p_ip_address: string
          p_reset_interval_hours?: number
          p_video_url: string
        }
        Returns: {
          message: string
          remaining_requests: number
          success: boolean
          usage_log_id: string
        }[]
      }
      increment_authenticated_usage: {
        Args: {
          p_action: string
          p_daily_limit?: number
          p_ip_address: string
          p_reset_interval_hours?: number
          p_user_id: string
          p_video_url: string
        }
        Returns: {
          message: string
          remaining_requests: number
          success: boolean
          usage_log_id: string
        }[]
      }
      process_anonymous_request: {
        Args: {
          p_action: string
          p_anonymous_limit: number
          p_ip_address: string
          p_reset_interval_hours: number
          p_video_url: string
        }
        Returns: {
          message: string
          remaining_requests: number
          success: boolean
          usage_log_id: string
        }[]
      }
      process_authenticated_request: {
        Args: {
          p_action: string
          p_daily_limit: number
          p_ip_address: string
          p_reset_interval_hours: number
          p_user_id: string
          p_video_url: string
        }
        Returns: {
          message: string
          remaining_requests: number
          success: boolean
          usage_log_id: string
        }[]
      }
      process_captcha_verified_request: {
        Args: {
          p_action: string
          p_ip_address: string
          p_reset_interval_hours: number
          p_video_url: string
        }
        Returns: {
          message: string
          remaining_requests: number
          success: boolean
          usage_log_id: string
        }[]
      }
      safe_ip_cast: { Args: { ip_text: string }; Returns: unknown }
      submit_feedback: {
        Args: {
          p_category: string
          p_email: string
          p_ip_address: string
          p_message: string
          p_rating: number
          p_title: string
          p_usage_log_id: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: {
          feedback_id: string
          message: string
          success: boolean
        }[]
      }
      update_feedback_status: {
        Args: {
          p_admin_notes: string
          p_admin_user_id: string
          p_feedback_id: string
          p_status: string
        }
        Returns: {
          message: string
          success: boolean
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

