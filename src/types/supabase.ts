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
    PostgrestVersion: "14.18"
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
      appointments: {
        Row: {
          category: string
          created_at: string
          date: string
          facility: string
          id: string
          notes: string | null
          provider: string | null
          status: string | null
          time: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date: string
          facility: string
          id: string
          notes?: string | null
          provider?: string | null
          status?: string | null
          time: string
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          facility?: string
          id?: string
          notes?: string | null
          provider?: string | null
          status?: string | null
          time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      diary_notes: {
        Row: {
          audio_duration_seconds: number | null
          audio_uri: string | null
          body: string
          created_at: string
          date: string
          id: string
          mood: string | null
          tags: Json | null
          title: string
          user_id: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_uri?: string | null
          body: string
          created_at?: string
          date: string
          id: string
          mood?: string | null
          tags?: Json | null
          title: string
          user_id?: string
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_uri?: string | null
          body?: string
          created_at?: string
          date?: string
          id?: string
          mood?: string | null
          tags?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          consultation_notes: Json | null
          created_at: string
          doctor_email: string | null
          doctor_id: string
          doctor_name: string
          doctor_specialty: string
          doctor_user_id: string | null
          duration_minutes: number
          id: string
          linked_appointment_id: string | null
          mode: string
          notes: string | null
          patient_email: string
          patient_id: string
          patient_name: string
          patient_phone: string
          patient_summary: Json | null
          patient_user_id: string
          practice_address: string
          practice_name: string
          prescriptions: Json | null
          price_zar: number
          service_id: string
          service_name: string
          sick_certificate: Json | null
          status: string
          telehealth_room_token: string | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          consultation_notes?: Json | null
          created_at?: string
          doctor_email?: string | null
          doctor_id: string
          doctor_name: string
          doctor_specialty: string
          doctor_user_id?: string | null
          duration_minutes: number
          id: string
          linked_appointment_id?: string | null
          mode: string
          notes?: string | null
          patient_email: string
          patient_id: string
          patient_name: string
          patient_phone: string
          patient_summary?: Json | null
          patient_user_id?: string
          practice_address: string
          practice_name: string
          prescriptions?: Json | null
          price_zar: number
          service_id: string
          service_name: string
          sick_certificate?: Json | null
          status?: string
          telehealth_room_token?: string | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          consultation_notes?: Json | null
          created_at?: string
          doctor_email?: string | null
          doctor_id?: string
          doctor_name?: string
          doctor_specialty?: string
          doctor_user_id?: string | null
          duration_minutes?: number
          id?: string
          linked_appointment_id?: string | null
          mode?: string
          notes?: string | null
          patient_email?: string
          patient_id?: string
          patient_name?: string
          patient_phone?: string
          patient_summary?: Json | null
          patient_user_id?: string
          practice_address?: string
          practice_name?: string
          prescriptions?: Json | null
          price_zar?: number
          service_id?: string
          service_name?: string
          sick_certificate?: Json | null
          status?: string
          telehealth_room_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          availability: Json
          avatar_url: string | null
          bio: string
          city: string
          consultation_modes: Json
          created_at: string
          email: string
          full_name: string
          hpcsa_number: string
          id: string
          medical_aids: Json
          patient_highlight: string | null
          phone: string
          practice_address: string
          practice_name: string
          province: string
          qualifications: Json
          rating: number
          reviews_count: number
          services: Json
          specialty: string
          title: string
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          availability?: Json
          avatar_url?: string | null
          bio: string
          city: string
          consultation_modes?: Json
          created_at?: string
          email: string
          full_name: string
          hpcsa_number: string
          id: string
          medical_aids?: Json
          patient_highlight?: string | null
          phone: string
          practice_address: string
          practice_name: string
          province: string
          qualifications?: Json
          rating?: number
          reviews_count?: number
          services?: Json
          specialty: string
          title: string
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          availability?: Json
          avatar_url?: string | null
          bio?: string
          city?: string
          consultation_modes?: Json
          created_at?: string
          email?: string
          full_name?: string
          hpcsa_number?: string
          id?: string
          medical_aids?: Json
          patient_highlight?: string | null
          phone?: string
          practice_address?: string
          practice_name?: string
          province?: string
          qualifications?: Json
          rating?: number
          reviews_count?: number
          services?: Json
          specialty?: string
          title?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          category: string
          clinical_notes: string | null
          created_at: string
          diagnosis: string | null
          doctor: string | null
          document_type: string
          event_date: string
          facility: string
          fields: Json | null
          follow_up: string | null
          id: string
          original_file_mime: string | null
          original_file_name: string | null
          original_file_uri: string | null
          remote_url: string | null
          source_type: string
          status: string
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category: string
          clinical_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor?: string | null
          document_type: string
          event_date: string
          facility: string
          fields?: Json | null
          follow_up?: string | null
          id: string
          original_file_mime?: string | null
          original_file_name?: string | null
          original_file_uri?: string | null
          remote_url?: string | null
          source_type: string
          status: string
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_at: string
          user_id?: string
        }
        Update: {
          category?: string
          clinical_notes?: string | null
          created_at?: string
          diagnosis?: string | null
          doctor?: string | null
          document_type?: string
          event_date?: string
          facility?: string
          fields?: Json | null
          follow_up?: string | null
          id?: string
          original_file_mime?: string | null
          original_file_name?: string | null
          original_file_uri?: string | null
          remote_url?: string | null
          source_type?: string
          status?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medications: {
        Row: {
          created_at: string
          dose: string
          frequency: string
          id: string
          instructions: string | null
          name: string
          prescribed_by: string | null
          purpose: string | null
          status: string | null
          times: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dose: string
          frequency: string
          id: string
          instructions?: string | null
          name: string
          prescribed_by?: string | null
          purpose?: string | null
          status?: string | null
          times?: Json | null
          user_id?: string
        }
        Update: {
          created_at?: string
          dose?: string
          frequency?: string
          id?: string
          instructions?: string | null
          name?: string
          prescribed_by?: string | null
          purpose?: string | null
          status?: string | null
          times?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          allergies: Json | null
          blood_group: string | null
          conditions: Json | null
          created_at: string
          date_of_birth: string
          emergency_contacts: Json | null
          first_name: string
          id: string
          last_name: string
          national_id: string | null
          preferred_name: string | null
          primary_facility: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: Json | null
          blood_group?: string | null
          conditions?: Json | null
          created_at?: string
          date_of_birth: string
          emergency_contacts?: Json | null
          first_name: string
          id: string
          last_name: string
          national_id?: string | null
          preferred_name?: string | null
          primary_facility?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          allergies?: Json | null
          blood_group?: string | null
          conditions?: Json | null
          created_at?: string
          date_of_birth?: string
          emergency_contacts?: Json | null
          first_name?: string
          id?: string
          last_name?: string
          national_id?: string | null
          preferred_name?: string | null
          primary_facility?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          app_version: string | null
          created_at: string
          device_name: string | null
          device_os: string | null
          expo_push_token: string
          id: string
          is_active: boolean | null
          patient_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          device_os?: string | null
          expo_push_token: string
          id: string
          is_active?: boolean | null
          patient_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          device_os?: string | null
          expo_push_token?: string
          id?: string
          is_active?: boolean | null
          patient_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_reminders_sync: {
        Row: {
          body: string
          id: string
          metadata: Json | null
          patient_id: string
          recurrence: string | null
          reminder_type: string
          scheduled_time: string
          status: string | null
          synced_at: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          id: string
          metadata?: Json | null
          patient_id: string
          recurrence?: string | null
          reminder_type: string
          scheduled_time: string
          status?: string | null
          synced_at?: string
          title: string
          user_id?: string
        }
        Update: {
          body?: string
          id?: string
          metadata?: Json | null
          patient_id?: string
          recurrence?: string | null
          reminder_type?: string
          scheduled_time?: string
          status?: string | null
          synced_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string
          diary_note_ids: Json | null
          duration_id: string
          expires_at: string
          id: string
          payload: Json | null
          pin: string
          recipient_facility: string
          recipient_name: string
          record_ids: Json | null
          share_code: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diary_note_ids?: Json | null
          duration_id: string
          expires_at: string
          id: string
          payload?: Json | null
          pin: string
          recipient_facility: string
          recipient_name: string
          record_ids?: Json | null
          share_code: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          diary_note_ids?: Json | null
          duration_id?: string
          expires_at?: string
          id?: string
          payload?: Json | null
          pin?: string
          recipient_facility?: string
          recipient_name?: string
          record_ids?: Json | null
          share_code?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          original_transaction_id: string | null
          plan: string
          product_id: string | null
          raw_metadata: Json | null
          source: string
          transaction_id: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          original_transaction_id?: string | null
          plan?: string
          product_id?: string | null
          raw_metadata?: Json | null
          source?: string
          transaction_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          original_transaction_id?: string | null
          plan?: string
          product_id?: string | null
          raw_metadata?: Json | null
          source?: string
          transaction_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_doctor_booked_slots: {
        Args: { p_date: string; p_doctor_id: string }
        Returns: { booking_time: string }[]
      }
      requesting_user_id: { Args: never; Returns: string }
      start_free_annual_trial: { Args: never; Returns: Json }
      verify_shared_link: {
        Args: { p_pin: string; p_share_code: string }
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
