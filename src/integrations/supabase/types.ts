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
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          created_by: string
          group_id: string | null
          id: string
          reason: string
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          created_by: string
          group_id?: string | null
          id?: string
          reason?: string
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          created_by?: string
          group_id?: string | null
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_infractions: {
        Row: {
          created_at: string
          detected_at: string
          expected_checkin_window_end: string | null
          grace_period_end: string | null
          group_id: string
          id: string
          infraction_date: string
          infraction_type: string
          reservation_id: string
          spot_id: string
          user_id: string
          warning_generated: boolean
          warning_id: string | null
        }
        Insert: {
          created_at?: string
          detected_at?: string
          expected_checkin_window_end?: string | null
          grace_period_end?: string | null
          group_id: string
          id?: string
          infraction_date: string
          infraction_type: string
          reservation_id: string
          spot_id: string
          user_id: string
          warning_generated?: boolean
          warning_id?: string | null
        }
        Update: {
          created_at?: string
          detected_at?: string
          expected_checkin_window_end?: string | null
          grace_period_end?: string | null
          group_id?: string
          id?: string
          infraction_date?: string
          infraction_type?: string
          reservation_id?: string
          spot_id?: string
          user_id?: string
          warning_generated?: boolean
          warning_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_infractions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_infractions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_infractions_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_infractions_warning_id_fkey"
            columns: ["warning_id"]
            isOneToOne: false
            referencedRelation: "user_warnings"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_notifications: {
        Row: {
          created_at: string | null
          delivery_status: string | null
          group_name: string | null
          id: string
          message: string
          minutes_remaining: number | null
          notification_type: string
          reservation_id: string
          sent_at: string | null
          spot_number: string | null
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_status?: string | null
          group_name?: string | null
          id?: string
          message: string
          minutes_remaining?: number | null
          notification_type: string
          reservation_id: string
          sent_at?: string | null
          spot_number?: string | null
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_status?: string | null
          group_name?: string | null
          id?: string
          message?: string
          minutes_remaining?: number | null
          notification_type?: string
          reservation_id?: string
          sent_at?: string | null
          spot_number?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_settings: {
        Row: {
          checkin_infraction_threshold: number
          checkout_infraction_threshold: number
          created_at: string
          default_checkin_window_hours: number
          grace_period_minutes: number
          id: string
          send_checkin_reminders: boolean
          system_enabled: boolean
          temporary_block_days: number
          updated_at: string
        }
        Insert: {
          checkin_infraction_threshold?: number
          checkout_infraction_threshold?: number
          created_at?: string
          default_checkin_window_hours?: number
          grace_period_minutes?: number
          id?: string
          send_checkin_reminders?: boolean
          system_enabled?: boolean
          temporary_block_days?: number
          updated_at?: string
        }
        Update: {
          checkin_infraction_threshold?: number
          checkout_infraction_threshold?: number
          created_at?: string
          default_checkin_window_hours?: number
          grace_period_minutes?: number
          id?: string
          send_checkin_reminders?: boolean
          system_enabled?: boolean
          temporary_block_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          admin_notes: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          description: string
          id: string
          offending_license_plate: string | null
          offending_user_id: string | null
          original_spot_id: string | null
          photo_url: string | null
          reassigned_reservation_id: string | null
          reassigned_spot_id: string | null
          reporter_id: string
          reservation_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          description: string
          id?: string
          offending_license_plate?: string | null
          offending_user_id?: string | null
          original_spot_id?: string | null
          photo_url?: string | null
          reassigned_reservation_id?: string | null
          reassigned_spot_id?: string | null
          reporter_id: string
          reservation_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          description?: string
          id?: string
          offending_license_plate?: string | null
          offending_user_id?: string | null
          original_spot_id?: string | null
          photo_url?: string | null
          reassigned_reservation_id?: string | null
          reassigned_spot_id?: string | null
          reporter_id?: string
          reservation_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_original_spot_id_fkey"
            columns: ["original_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_reassigned_reservation_id_fkey"
            columns: ["reassigned_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_reassigned_spot_id_fkey"
            columns: ["reassigned_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
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
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parking_group_checkin_config: {
        Row: {
          created_at: string
          custom_checkin_window_hours: number | null
          enabled: boolean
          group_id: string
          id: string
          updated_at: string
          use_custom_config: boolean
        }
        Insert: {
          created_at?: string
          custom_checkin_window_hours?: number | null
          enabled?: boolean
          group_id: string
          id?: string
          updated_at?: string
          use_custom_config?: boolean
        }
        Update: {
          created_at?: string
          custom_checkin_window_hours?: number | null
          enabled?: boolean
          group_id?: string
          id?: string
          updated_at?: string
          use_custom_config?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "parking_group_checkin_config_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_groups: {
        Row: {
          button_size: number | null
          capacity: number
          created_at: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          description: string | null
          floor_plan_url: string | null
          id: string
          is_active: boolean | null
          is_incident_reserve: boolean | null
          name: string
          scheduled_deactivation_date: string | null
          updated_at: string | null
        }
        Insert: {
          button_size?: number | null
          capacity?: number
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          description?: string | null
          floor_plan_url?: string | null
          id?: string
          is_active?: boolean | null
          is_incident_reserve?: boolean | null
          name: string
          scheduled_deactivation_date?: string | null
          updated_at?: string | null
        }
        Update: {
          button_size?: number | null
          capacity?: number
          created_at?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          description?: string | null
          floor_plan_url?: string | null
          id?: string
          is_active?: boolean | null
          is_incident_reserve?: boolean | null
          name?: string
          scheduled_deactivation_date?: string | null
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
          checkin_reminders_enabled: boolean | null
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
          checkin_reminders_enabled?: boolean | null
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
          checkin_reminders_enabled?: boolean | null
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
      reservation_cancellation_log: {
        Row: {
          cancellation_reason: string
          cancelled_at: string | null
          id: string
          metadata: Json | null
          reservation_id: string
          triggered_by: string
          user_id: string
        }
        Insert: {
          cancellation_reason: string
          cancelled_at?: string | null
          id?: string
          metadata?: Json | null
          reservation_id: string
          triggered_by: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string
          cancelled_at?: string | null
          id?: string
          metadata?: Json | null
          reservation_id?: string
          triggered_by?: string
          user_id?: string
        }
        Relationships: []
      }
      reservation_checkins: {
        Row: {
          checkin_at: string | null
          checkout_at: string | null
          continuous_end_date: string | null
          continuous_start_date: string | null
          created_at: string
          group_id: string
          id: string
          is_continuous_reservation: boolean
          reservation_id: string
          spot_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checkin_at?: string | null
          checkout_at?: string | null
          continuous_end_date?: string | null
          continuous_start_date?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_continuous_reservation?: boolean
          reservation_id: string
          spot_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checkin_at?: string | null
          checkout_at?: string | null
          continuous_end_date?: string | null
          continuous_start_date?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_continuous_reservation?: boolean
          reservation_id?: string
          spot_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_checkins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_checkins_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_checkins_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_settings: {
        Row: {
          advance_reservation_days: number
          created_at: string | null
          daily_refresh_hour: number
          fast_reservation_threshold_minutes: number | null
          id: string
          updated_at: string | null
          waitlist_acceptance_time_minutes: number
          waitlist_enabled: boolean
          waitlist_max_simultaneous: number
          waitlist_penalty_duration_days: number
          waitlist_penalty_enabled: boolean
          waitlist_penalty_threshold: number
          waitlist_priority_by_role: boolean
        }
        Insert: {
          advance_reservation_days?: number
          created_at?: string | null
          daily_refresh_hour?: number
          fast_reservation_threshold_minutes?: number | null
          id?: string
          updated_at?: string | null
          waitlist_acceptance_time_minutes?: number
          waitlist_enabled?: boolean
          waitlist_max_simultaneous?: number
          waitlist_penalty_duration_days?: number
          waitlist_penalty_enabled?: boolean
          waitlist_penalty_threshold?: number
          waitlist_priority_by_role?: boolean
        }
        Update: {
          advance_reservation_days?: number
          created_at?: string | null
          daily_refresh_hour?: number
          fast_reservation_threshold_minutes?: number | null
          id?: string
          updated_at?: string | null
          waitlist_acceptance_time_minutes?: number
          waitlist_enabled?: boolean
          waitlist_max_simultaneous?: number
          waitlist_penalty_duration_days?: number
          waitlist_penalty_enabled?: boolean
          waitlist_penalty_threshold?: number
          waitlist_priority_by_role?: boolean
        }
        Relationships: []
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
      user_blocks: {
        Row: {
          block_type: string
          blocked_at: string
          blocked_until: string
          created_at: string
          id: string
          is_active: boolean
          reason: string
          unblocked_at: string | null
          user_id: string
          warning_id: string | null
        }
        Insert: {
          block_type: string
          blocked_at?: string
          blocked_until: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason: string
          unblocked_at?: string | null
          user_id: string
          warning_id?: string | null
        }
        Update: {
          block_type?: string
          blocked_at?: string
          blocked_until?: string
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string
          unblocked_at?: string | null
          user_id?: string
          warning_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_warning_id_fkey"
            columns: ["warning_id"]
            isOneToOne: false
            referencedRelation: "user_warnings"
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
      user_warnings: {
        Row: {
          auto_generated: boolean
          created_at: string | null
          id: string
          incident_id: string
          infraction_count: number | null
          issued_at: string | null
          issued_by: string
          notes: string | null
          reason: string
          user_id: string
          viewed_at: string | null
          warning_type: string | null
        }
        Insert: {
          auto_generated?: boolean
          created_at?: string | null
          id?: string
          incident_id: string
          infraction_count?: number | null
          issued_at?: string | null
          issued_by: string
          notes?: string | null
          reason: string
          user_id: string
          viewed_at?: string | null
          warning_type?: string | null
        }
        Update: {
          auto_generated?: boolean
          created_at?: string | null
          id?: string
          incident_id?: string
          infraction_count?: number | null
          issued_at?: string | null
          issued_by?: string
          notes?: string | null
          reason?: string
          user_id?: string
          viewed_at?: string | null
          warning_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incident_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_cron_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          job_name: string
          records_affected: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_status: string
          execution_time_ms?: number | null
          id?: string
          job_name: string
          records_affected?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          job_name?: string
          records_affected?: number | null
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          created_at: string
          group_id: string
          id: string
          position: number | null
          reservation_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          position?: number | null
          reservation_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          position?: number | null
          reservation_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "parking_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entry_id: string | null
          id: string
          offer_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entry_id?: string | null
          id?: string
          offer_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entry_id?: string | null
          id?: string
          offer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_logs_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_logs_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "waitlist_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_offers: {
        Row: {
          created_at: string
          entry_id: string
          expires_at: string
          id: string
          reservation_date: string
          responded_at: string | null
          spot_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          expires_at: string
          id?: string
          reservation_date: string
          responded_at?: string | null
          spot_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          expires_at?: string
          id?: string
          reservation_date?: string
          responded_at?: string | null
          spot_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_offers_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_offers_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_penalties: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          is_blocked: boolean
          last_reset_at: string
          no_response_count: number
          rejection_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          last_reset_at?: string
          no_response_count?: number
          rejection_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          last_reset_at?: string
          no_response_count?: number
          rejection_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_waitlist_offer: {
        Args: { p_offer_id: string; p_user_id: string }
        Returns: string
      }
      calculate_waitlist_position: {
        Args: { p_entry_id: string }
        Returns: number
      }
      cancel_all_user_future_reservations: {
        Args: { _user_id: string }
        Returns: number
      }
      cancel_reservations_for_blocked_date: {
        Args: { _admin_id: string; _blocked_date: string }
        Returns: number
      }
      cancel_user_reservations_in_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: number
      }
      cancel_waitlist_entry: {
        Args: { p_entry_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      check_user_penalty_status: {
        Args: { p_user_id: string }
        Returns: {
          blocked_until: string
          can_register: boolean
          is_blocked: boolean
          no_response_count: number
          rejection_count: number
        }[]
      }
      check_user_waitlist_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_expired_waitlist_entries: {
        Args: never
        Returns: {
          blocked_users_deleted: number
          expired_dates_deleted: number
          no_access_deleted: number
          no_plate_deleted: number
          total_deleted: number
        }[]
      }
      create_waitlist_offer: {
        Args: { p_entry_id: string; p_spot_id: string }
        Returns: string
      }
      cron_cleanup_expired_waitlist_entries: { Args: never; Returns: undefined }
      cron_expire_waitlist_offers: { Args: never; Returns: undefined }
      deactivate_parking_group: {
        Args: { _admin_id: string; _group_id: string; _reason: string }
        Returns: undefined
      }
      deactivate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: undefined
      }
      detect_checkin_infractions: { Args: never; Returns: number }
      detect_checkout_infractions: { Args: never; Returns: number }
      expire_waitlist_offers: { Args: never; Returns: number }
      extract_storage_path_from_url: { Args: { url: string }; Returns: string }
      find_available_spot_for_incident: {
        Args: { _date: string; _original_spot_id: string; _user_id: string }
        Returns: {
          floor_plan_url: string
          group_id: string
          group_name: string
          position_x: number
          position_y: number
          spot_id: string
          spot_number: string
        }[]
      }
      find_user_by_license_plate: {
        Args: { _plate_number: string }
        Returns: string
      }
      generate_automatic_warnings: { Args: never; Returns: number }
      get_activity_by_hour: {
        Args: { p_end_date: string; p_group_id?: string; p_start_date: string }
        Returns: {
          hour: number
          reservations: number
        }[]
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
      get_available_spots_with_checkout: {
        Args: { p_date: string; p_group_id: string }
        Returns: {
          is_early_checkout: boolean
          spot_id: string
          spot_number: string
        }[]
      }
      get_avg_reservation_time: {
        Args: {
          p_end_date: string
          p_group_id?: string
          p_start_date: string
          p_unlock_hour?: number
        }
        Returns: {
          avg_minutes: number
        }[]
      }
      get_fastest_user: {
        Args: {
          p_end_date: string
          p_group_id?: string
          p_start_date: string
          p_unlock_hour?: number
        }
        Returns: {
          fastest_minutes: number
          full_name: string
          user_id: string
        }[]
      }
      get_heatmap_data: {
        Args: { p_end_date: string; p_group_id?: string; p_start_date: string }
        Returns: {
          count: number
          day_of_week: number
          hour: number
        }[]
      }
      get_next_in_waitlist: {
        Args: { p_date: string; p_group_id: string }
        Returns: {
          entry_id: string
          queue_position: number
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_peak_hour: {
        Args: { p_end_date: string; p_group_id?: string; p_start_date: string }
        Returns: {
          count: number
          hour: number
        }[]
      }
      get_reservable_date_range: {
        Args: never
        Returns: {
          max_date: string
          min_date: string
        }[]
      }
      get_top_fast_users: {
        Args: {
          p_end_date: string
          p_fast_threshold?: number
          p_group_id?: string
          p_limit?: number
          p_start_date: string
          p_unlock_hour?: number
        }
        Returns: {
          avg_minutes: number
          email: string
          fast_reservations: number
          full_name: string
          percentage: number
          total_reservations: number
          user_id: string
        }[]
      }
      get_user_checkin_notifications: {
        Args: { p_limit?: number; p_user_id?: string }
        Returns: {
          group_name: string
          id: string
          message: string
          minutes_remaining: number
          notification_type: string
          sent_at: string
          spot_number: string
          subject: string
        }[]
      }
      get_user_role_priority: { Args: { _user_id: string }; Returns: number }
      get_user_warning_count: { Args: { _user_id: string }; Returns: number }
      get_waitlist_settings: {
        Args: never
        Returns: {
          acceptance_time_minutes: number
          max_simultaneous: number
          penalty_duration_days: number
          penalty_enabled: boolean
          penalty_threshold: number
          priority_by_role: boolean
          waitlist_enabled: boolean
        }[]
      }
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
      is_user_blocked_by_checkin: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      perform_checkin: {
        Args: { p_reservation_id: string; p_user_id: string }
        Returns: Json
      }
      perform_checkout: {
        Args: { p_reservation_id: string; p_user_id: string }
        Returns: Json
      }
      permanently_delete_user: {
        Args: {
          _admin_id: string
          _password_confirmation: string
          _user_id: string
        }
        Returns: undefined
      }
      process_waitlist_for_spot: {
        Args: { p_date: string; p_spot_id: string }
        Returns: string
      }
      reactivate_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: undefined
      }
      register_in_waitlist: {
        Args: { p_date: string; p_group_id: string; p_user_id: string }
        Returns: {
          entry_id: string
          message: string
          queue_position: number
          success: boolean
        }[]
      }
      reject_waitlist_offer: {
        Args: { p_offer_id: string; p_user_id: string }
        Returns: undefined
      }
      send_checkin_reminders: {
        Args: never
        Returns: {
          group_name: string
          minutes_remaining: number
          notification_id: string
          notification_sent: boolean
          reservation_date: string
          spot_number: string
          user_email: string
          user_id: string
          user_name: string
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["general", "preferred", "director", "visitor", "admin"],
    },
  },
} as const
