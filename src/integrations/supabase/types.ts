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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assignment_link_opens: {
        Row: {
          assignment_id: string
          id: string
          opened_at: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          id?: string
          opened_at?: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          id?: string
          opened_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_link_opens_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_kind: string
          class_code: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          link_url: string | null
          media_url: string | null
          questions: Json | null
          title: string
          total_marks: number | null
        }
        Insert: {
          assignment_kind?: string
          class_code: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          questions?: Json | null
          title: string
          total_marks?: number | null
        }
        Update: {
          assignment_kind?: string
          class_code?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          link_url?: string | null
          media_url?: string | null
          questions?: Json | null
          title?: string
          total_marks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_code_fkey"
            columns: ["class_code"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_code"]
          },
        ]
      }
      chat_messages: {
        Row: {
          class_code: string
          created_at: string
          id: string
          message_text: string
          sender_id: string
        }
        Insert: {
          class_code: string
          created_at?: string
          id?: string
          message_text: string
          sender_id: string
        }
        Update: {
          class_code?: string
          created_at?: string
          id?: string
          message_text?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_class_code_fkey"
            columns: ["class_code"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_code"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string
          created_at: string
          description: string | null
          grade: string | null
          id: string
          teacher_id: string
          title: string
        }
        Insert: {
          class_code: string
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          teacher_id: string
          title: string
        }
        Update: {
          class_code?: string
          created_at?: string
          description?: string | null
          grade?: string | null
          id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          class_code: string
          content: string
          created_at: string
          id: string
          sender_id: string
          student_id: string
          teacher_id: string
        }
        Insert: {
          class_code: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
          student_id: string
          teacher_id: string
        }
        Update: {
          class_code?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          student_id?: string
          teacher_id?: string
        }
        Relationships: []
      }
      enrollment_requests: {
        Row: {
          class_code: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          kind: string
          reason: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_code: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind: string
          reason?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_code?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          kind?: string
          reason?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_requests_class_code_fkey"
            columns: ["class_code"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_code"]
          },
          {
            foreignKeyName: "enrollment_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_code: string
          enrolled_at: string
          id: string
          student_id: string
          suspended: boolean
        }
        Insert: {
          class_code: string
          enrolled_at?: string
          id?: string
          student_id: string
          suspended?: boolean
        }
        Update: {
          class_code?: string
          enrolled_at?: string
          id?: string
          student_id?: string
          suspended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_code_fkey"
            columns: ["class_code"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_code"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number
          role: string
          uses: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          role: string
          uses?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          role?: string
          uses?: number
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          self_assessment: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          self_assessment?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          self_assessment?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          subject: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          subject?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          age: number | null
          age_group: string | null
          biggest_challenge: string | null
          class_grade: string | null
          created_at: string
          discovery_source: string | null
          id: string
          purpose: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          age_group?: string | null
          biggest_challenge?: string | null
          class_grade?: string | null
          created_at?: string
          discovery_source?: string | null
          id?: string
          purpose?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          age_group?: string | null
          biggest_challenge?: string | null
          class_grade?: string | null
          created_at?: string
          discovery_source?: string | null
          id?: string
          purpose?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          deactivated_at: string | null
          email: string
          feedback_prompt_dismissed: boolean
          feedback_prompt_snooze_until: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_suspended: boolean
          notification_preferences: Json
          phone: string | null
          phone_verified: boolean
          preferred_language: string
          role: string
          school: string | null
          theme_preference: string
          wa_verify_code: string | null
        }
        Insert: {
          created_at?: string
          current_streak?: number
          deactivated_at?: string | null
          email: string
          feedback_prompt_dismissed?: boolean
          feedback_prompt_snooze_until?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_suspended?: boolean
          notification_preferences?: Json
          phone?: string | null
          phone_verified?: boolean
          preferred_language?: string
          role?: string
          school?: string | null
          theme_preference?: string
          wa_verify_code?: string | null
        }
        Update: {
          created_at?: string
          current_streak?: number
          deactivated_at?: string | null
          email?: string
          feedback_prompt_dismissed?: boolean
          feedback_prompt_snooze_until?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_suspended?: boolean
          notification_preferences?: Json
          phone?: string | null
          phone_verified?: boolean
          preferred_language?: string
          role?: string
          school?: string | null
          theme_preference?: string
          wa_verify_code?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          answers: Json | null
          assignment_id: string
          feedback: string | null
          file_url: string | null
          grade: string | null
          id: string
          notes: string | null
          obtained_marks: number | null
          percentage: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json | null
          assignment_id: string
          feedback?: string | null
          file_url?: string | null
          grade?: string | null
          id?: string
          notes?: string | null
          obtained_marks?: number | null
          percentage?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json | null
          assignment_id?: string
          feedback?: string | null
          file_url?: string | null
          grade?: string | null
          id?: string
          notes?: string | null
          obtained_marks?: number | null
          percentage?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_status: {
        Args: {
          new_is_suspended: boolean
          new_role: string
          target_user_id: string
        }
        Returns: Json
      }
      is_admin: { Args: { _uid: string }; Returns: boolean }
      is_class_teacher: {
        Args: { _class_code: string; _uid: string }
        Returns: boolean
      }
      is_enrolled: {
        Args: { _class_code: string; _uid: string }
        Returns: boolean
      }
      join_class: { Args: { _code: string }; Returns: Json }
      request_role_upgrade: {
        Args: { invite_code: string; requested_role: string }
        Returns: Json
      }
      user_deactivate_account: { Args: never; Returns: Json }
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
  public: {
    Enums: {},
  },
} as const
