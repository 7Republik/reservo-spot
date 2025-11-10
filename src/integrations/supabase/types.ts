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
      incident_reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          reporter_id: string
          reservation_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          reporter_id: string
          reservation_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          reporter_id?: string
          reservation_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      license_plates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_disability: boolean | null
          approved_electric: boolean | null
          deleted_at: string | null
          deleted_by_user: boolean | null
          disability_expires_at: string | null
          electric_expires_at: string | null
          id: string
          is_approved: boolean | null
          plate_number: string
          rejected_at: string | null
          rejection_reason: string | null
          requested_at: string | null
          requested_disability: boolean | null
          requested_electric: boolean | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_disability?: boolean | null
          approved_electric?: boolean | null
          deleted_at?: string | null
          deleted_by_user?: boolean | null
          disability_expires_at?: string | null
          electric_expires_at?: string | null
          id?: string
          is_approved?: boolean | null
          plate_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_disability?: boolean | null
          requested_electric?: boolean | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_disability?: boolean | null
          approved_electric?: boolean | null
          deleted_at?: string | null
          deleted_by_user?: boolean | null
          disability_expires_at?: string | null
          electric_expires_at?: string | null
          id?: string
          is_approved?: boolean | null
          plate_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          requested_disability?: boolean | null
          requested_electric?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      parking_groups: {
        Row: {
          button_size: number | null
          capacity: number
          created_at: string | null
          description: string | null
          floor_plan_url: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          button_size?: number | null
          capacity?: number
          created_at?: string | null
          description?: string | null
          floor_plan_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          button_size?: number | null
          capacity?: number
          created_at?: string | null
          description?: string | null
          floor_plan_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      parking_spots: {
        Row: {
          created_at: string | null
          group_id: string | null
          has_charger: boolean | null
          id: string
          is_accessible: boolean | null
          is_active: boolean | null
          is_compact: boolean | null
          notes: string | null
          position_x: number | null
          position_y: number | null
          spot_number: string
          spot_type: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          visual_size: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          has_charger?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_compact?: boolean | null
          notes?: string | null
          position_x?: number | null
          position_y?: number | null
          spot_number: string
          spot_type?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          visual_size?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          has_charger?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_active?: boolean | null
          is_compact?: boolean | null
          notes?: string | null
          position_x?: number | null
          position_y?: number | null
          spot_number?: string
          spot_type?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          visual_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_spots_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          blocked_reason: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          email: string
          full_name: string | null
          id: string
          is_blocked: boolean | null
          is_deactivated: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_blocked?: boolean | null
          is_deactivated?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_reason?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean | null
          is_deactivated?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          id: string
          reservation_date: string
          spot_id: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          reservation_date: string
          spot_id: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          reservation_date?: string
          spot_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_group_assignments: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      deactivate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: undefined
      }
      get_available_spots_by_group: {
        Args: { _date: string; _group_id: string }
        Returns: {
          has_charger: boolean
          is_accessible: boolean
          is_compact: boolean
          position_x: number
          position_y: number
          spot_id: string
          spot_number: string
        }[]
      }
      get_user_role_priority: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_disability_permit: {
        Args: { plate_id: string }
        Returns: boolean
      }
      has_valid_electric_permit: {
        Args: { plate_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      permanently_delete_user: {
        Args: {
          _admin_id: string
          _password_confirmation: string
          _user_id: string
        }
        Returns: undefined
      }
      reactivate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: undefined
      }
      validate_parking_spot_reservation: {
        Args: { _reservation_date: string; _spot_id: string; _user_id: string }
        Returns: {
          error_code: string
          error_message: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "general" | "preferred" | "director" | "visitor" | "admin"
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
      app_role: ["general", "preferred", "director", "visitor", "admin"],
    },
  },
} as const
