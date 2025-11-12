import { Database } from '@/integrations/supabase/types';

// Base types from database
export type IncidentStatus = 'pending' | 'confirmed' | 'dismissed';

export type IncidentReport = Database['public']['Tables']['incident_reports']['Row'];
export type IncidentReportInsert = Database['public']['Tables']['incident_reports']['Insert'];
export type IncidentReportUpdate = Database['public']['Tables']['incident_reports']['Update'];

export type UserWarning = Database['public']['Tables']['user_warnings']['Row'];
export type UserWarningInsert = Database['public']['Tables']['user_warnings']['Insert'];

// Extended types with joined data
export interface IncidentReportWithDetails extends IncidentReport {
  reporter: {
    id: string;
    full_name: string;
    email: string;
  };
  offending_user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  original_spot: {
    spot_number: string;
    group_name: string;
  } | null;
  reassigned_spot: {
    spot_number: string;
    group_name: string;
  } | null;
}

// Form data types
export interface IncidentReportFormData {
  reservationId: string;
  originalSpotId: string;
  description: string;
  offendingLicensePlate: string;
  photoFile: File;
}

// Result types
export interface SpotReassignmentResult {
  success: boolean;
  reassignedSpotId: string | null;
  reassignedSpotNumber: string | null;
  groupName: string | null;
  positionX: number | null;
  positionY: number | null;
  errorMessage: string | null;
}
