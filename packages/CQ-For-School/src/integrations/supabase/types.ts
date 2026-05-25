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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accreditation_documents: {
        Row: {
          created_at: string
          domain_id: string
          file_name: string
          file_path: string
          id: string
          school_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          domain_id: string
          file_name: string
          file_path: string
          id?: string
          school_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          domain_id?: string
          file_name?: string
          file_path?: string
          id?: string
          school_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      accreditation_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          domain_scores: Json
          generated_at: string
          generated_by: string
          id: string
          narrative_text: string
          report_type: string
          school_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          domain_scores?: Json
          generated_at?: string
          generated_by: string
          id?: string
          narrative_text: string
          report_type?: string
          school_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          domain_scores?: Json
          generated_at?: string
          generated_by?: string
          id?: string
          narrative_text?: string
          report_type?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accreditation_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cpd_certificates: {
        Row: {
          attendance_id: string | null
          duration_hours: number
          id: string
          issued_at: string
          school_id: string
          school_name: string
          session_date: string
          session_id: string
          session_title: string
          staff_name: string
          staff_user_id: string | null
          standard_code: string | null
          standard_name: string | null
        }
        Insert: {
          attendance_id?: string | null
          duration_hours: number
          id?: string
          issued_at?: string
          school_id: string
          school_name: string
          session_date: string
          session_id: string
          session_title: string
          staff_name: string
          staff_user_id?: string | null
          standard_code?: string | null
          standard_name?: string | null
        }
        Update: {
          attendance_id?: string | null
          duration_hours?: number
          id?: string
          issued_at?: string
          school_id?: string
          school_name?: string
          session_date?: string
          session_id?: string
          session_title?: string
          staff_name?: string
          staff_user_id?: string | null
          standard_code?: string | null
          standard_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cpd_certificates_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "session_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpd_certificates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cpd_certificates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      interventions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          intervention_id: string
          planned_at: string | null
          school_id: string
          standard_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          intervention_id: string
          planned_at?: string | null
          school_id: string
          standard_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          intervention_id?: string
          planned_at?: string | null
          school_id?: string
          standard_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration_hours: number
          format: string
          id: string
          intervention_id: string | null
          max_capacity: number | null
          meeting_link: string | null
          scheduled_date: string
          school_id: string
          session_type: string
          standard_id: string | null
          status: string
          target_group: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration_hours?: number
          format?: string
          id?: string
          intervention_id?: string | null
          max_capacity?: number | null
          meeting_link?: string | null
          scheduled_date: string
          school_id: string
          session_type?: string
          standard_id?: string | null
          status?: string
          target_group?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration_hours?: number
          format?: string
          id?: string
          intervention_id?: string | null
          max_capacity?: number | null
          meeting_link?: string | null
          scheduled_date?: string
          school_id?: string
          session_type?: string
          standard_id?: string | null
          status?: string
          target_group?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      pd_attendance: {
        Row: {
          attended: boolean
          attendee_name: string
          attendee_user_id: string | null
          certificate_generated: boolean
          created_at: string
          id: string
          school_id: string
          session_id: string
        }
        Insert: {
          attended?: boolean
          attendee_name: string
          attendee_user_id?: string | null
          certificate_generated?: boolean
          created_at?: string
          id?: string
          school_id: string
          session_id: string
        }
        Update: {
          attended?: boolean
          attendee_name?: string
          attendee_user_id?: string | null
          certificate_generated?: boolean
          created_at?: string
          id?: string
          school_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pd_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pd_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pd_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pd_sessions: {
        Row: {
          created_at: string
          created_by: string
          duration_hours: number
          format: string
          id: string
          intervention_id: string | null
          meeting_link: string | null
          scheduled_date: string
          school_id: string
          standard_id: string | null
          status: string
          target_group: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_hours?: number
          format?: string
          id?: string
          intervention_id?: string | null
          meeting_link?: string | null
          scheduled_date: string
          school_id: string
          standard_id?: string | null
          status?: string
          target_group?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_hours?: number
          format?: string
          id?: string
          intervention_id?: string | null
          meeting_link?: string | null
          scheduled_date?: string
          school_id?: string
          standard_id?: string | null
          status?: string
          target_group?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pd_sessions_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pd_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          id: string
          next_review_date: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          next_review_date?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          next_review_date?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          attended: boolean
          attendee_name: string
          attendee_user_id: string | null
          certificate_issued: boolean
          id: string
          notes: string | null
          recorded_at: string
          school_id: string
          session_id: string
        }
        Insert: {
          attended?: boolean
          attendee_name: string
          attendee_user_id?: string | null
          certificate_issued?: boolean
          id?: string
          notes?: string | null
          recorded_at?: string
          school_id: string
          session_id: string
        }
        Update: {
          attended?: boolean
          attendee_name?: string
          attendee_user_id?: string | null
          certificate_issued?: boolean
          id?: string
          notes?: string | null
          recorded_at?: string
          school_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_registrations: {
        Row: {
          id: string
          registered_at: string
          registered_name: string
          school_id: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          registered_name: string
          school_id: string
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          registered_name?: string
          school_id?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_registrations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          responses: Json
          school_id: string
          user_id: string
          week: string
        }
        Insert: {
          created_at?: string
          id?: string
          responses?: Json
          school_id: string
          user_id: string
          week: string
        }
        Update: {
          created_at?: string
          id?: string
          responses?: Json
          school_id?: string
          user_id?: string
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          school_id: string
          token: string
          used_at: string | null
          user_id: string
          week: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          school_id: string
          token?: string
          used_at?: string | null
          user_id: string
          week: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          school_id?: string
          token?: string
          used_at?: string | null
          user_id?: string
          week?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_tokens_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          department: string | null
          display_name: string | null
          grade_level: string | null
          onboarded: boolean
          school_id: string | null
          tenure_band: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          department?: string | null
          display_name?: string | null
          grade_level?: string | null
          onboarded?: boolean
          school_id?: string | null
          tenure_band?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          department?: string | null
          display_name?: string | null
          grade_level?: string | null
          onboarded?: boolean
          school_id?: string | null
          tenure_band?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "teacher"
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
      app_role: ["admin", "teacher"],
    },
  },
} as const
