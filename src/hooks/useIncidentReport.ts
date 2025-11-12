import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  sanitizeLicensePlate,
  uploadIncidentPhoto,
  deleteIncidentPhoto,
} from '@/lib/incidentHelpers';
import type {
  SpotReassignmentResult,
  IncidentReportInsert,
} from '@/types/incidents';

/**
 * Hook for managing the incident reporting flow
 * Handles multi-step state management, photo upload, license plate matching,
 * spot reassignment, and incident creation
 */
export const useIncidentReport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  /**
   * Finds a user by their license plate number
   * Matches against approved, non-deleted license plates
   * 
   * @param licensePlate - The license plate to search for
   * @returns User ID if found, null otherwise
   */
  const findUserByLicensePlate = async (
    licensePlate: string
  ): Promise<string | null> => {
    try {
      const sanitized = sanitizeLicensePlate(licensePlate);
      
      console.log('Searching for license plate:', sanitized);

      // Use security definer function to search without exposing all plates
      const { data, error } = await supabase
        .rpc('find_user_by_license_plate', {
          _plate_number: sanitized
        });

      if (error) {
        console.error('Error searching license plates:', error);
        return null;
      }

      console.log('Found user ID:', data);

      if (!data) {
        console.log('No matching license plate found');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error finding user by license plate:', error);
      return null;
    }
  };

  /**
   * Finds an available spot for incident reassignment
   * Uses the SQL function that implements priority logic:
   * 1. General groups (is_incident_reserve = false)
   * 2. Incident reserve groups (is_incident_reserve = true)
   * 
   * @param userId - The user ID who needs reassignment
   * @param date - The reservation date (YYYY-MM-DD)
   * @param originalSpotId - The original spot ID to exclude
   * @returns SpotReassignmentResult with spot details or error
   */
  const findAvailableSpot = async (
    userId: string,
    date: string,
    originalSpotId: string
  ): Promise<SpotReassignmentResult> => {
    try {
      const { data, error } = await supabase.rpc(
        'find_available_spot_for_incident',
        {
          _user_id: userId,
          _date: date,
          _original_spot_id: originalSpotId,
        }
      );

      if (error) {
        console.error('Error finding available spot:', error);
        return {
          success: false,
          reassignedSpotId: null,
          reassignedSpotNumber: null,
          reassignedGroupId: null,
          groupName: null,
          positionX: null,
          positionY: null,
          floorPlanUrl: null,
          errorMessage: 'Error al buscar plaza disponible',
        };
      }

      // Check if a spot was found
      if (!data || data.length === 0) {
        return {
          success: false,
          reassignedSpotId: null,
          reassignedSpotNumber: null,
          reassignedGroupId: null,
          groupName: null,
          positionX: null,
          positionY: null,
          floorPlanUrl: null,
          errorMessage: 'No hay plazas disponibles',
        };
      }

      const spot = data[0];
      return {
        success: true,
        reassignedSpotId: spot.spot_id,
        reassignedSpotNumber: spot.spot_number,
        reassignedGroupId: spot.group_id,
        groupName: spot.group_name,
        positionX: spot.position_x,
        positionY: spot.position_y,
        floorPlanUrl: spot.floor_plan_url,
        errorMessage: null,
      };
    } catch (error) {
      console.error('Error in findAvailableSpot:', error);
      return {
        success: false,
        reassignedSpotId: null,
        reassignedSpotNumber: null,
        reassignedGroupId: null,
        groupName: null,
        positionX: null,
        positionY: null,
        floorPlanUrl: null,
        errorMessage: 'Error inesperado al buscar plaza',
      };
    }
  };

  /**
   * Creates a new reservation for the reassigned spot
   * 
   * @param userId - The user ID
   * @param spotId - The new spot ID
   * @param date - The reservation date (YYYY-MM-DD)
   * @returns Reservation ID if successful, null otherwise
   */
  const createReassignedReservation = async (
    userId: string,
    spotId: string,
    date: string
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: userId,
          spot_id: spotId,
          reservation_date: date,
          status: 'active',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating reassigned reservation:', error);
        toast.error('Error al crear la nueva reserva');
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createReassignedReservation:', error);
      toast.error('Error inesperado al crear la reserva');
      return null;
    }
  };

  /**
   * Creates an incident report with photo upload and database insert
   * Handles the complete flow: photo upload, license plate matching,
   * spot reassignment, and incident record creation
   * 
   * @param params - Incident report parameters
   * @returns SpotReassignmentResult with success status and details
   */
  const createIncidentReport = async (params: {
    reservationId: string;
    originalSpotId: string;
    userId: string;
    date: string;
    description: string;
    offendingLicensePlate: string;
    photoFile: File;
  }): Promise<SpotReassignmentResult> => {
    setIsLoading(true);

    try {
      // Step 1: Find offending user by license plate
      const sanitizedPlate = sanitizeLicensePlate(params.offendingLicensePlate);
      const offendingUserId = await findUserByLicensePlate(sanitizedPlate);

      if (!offendingUserId) {
        console.log('License plate not found in system:', sanitizedPlate);
        // Continue anyway - admin can identify user later
      }

      // Step 2: Find available spot for reassignment
      const reassignmentResult = await findAvailableSpot(
        params.userId,
        params.date,
        params.originalSpotId
      );

      // Step 3: Cancel original reservation
      const { error: cancelError } = await supabase
        .from('reservations')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString() 
        })
        .eq('id', params.reservationId);

      if (cancelError) {
        console.error('Error cancelling original reservation:', cancelError);
        toast.error('Error al cancelar la reserva original');
        return {
          success: false,
          reassignedSpotId: null,
          reassignedSpotNumber: null,
          reassignedGroupId: null,
          groupName: null,
          positionX: null,
          positionY: null,
          floorPlanUrl: null,
          errorMessage: 'Error al cancelar la reserva original',
        };
      }

      // Step 4: Create reassigned reservation if spot found
      let reassignedReservationId: string | null = null;
      if (reassignmentResult.success && reassignmentResult.reassignedSpotId) {
        reassignedReservationId = await createReassignedReservation(
          params.userId,
          reassignmentResult.reassignedSpotId,
          params.date
        );

        if (!reassignedReservationId) {
          // Failed to create reservation - return error
          return {
            ...reassignmentResult,
            success: false,
            errorMessage: 'Error al crear la reserva de la nueva plaza',
          };
        }
      }

      // Step 5: Generate incident ID for photo upload
      const tempIncidentId = crypto.randomUUID();

      // Step 6: Upload photo
      let photoPath: string | null = null;
      try {
        photoPath = await uploadIncidentPhoto(
          params.photoFile,
          params.userId,
          tempIncidentId
        );
        setUploadedPhotoUrl(photoPath);
      } catch (error) {
        console.error('Photo upload failed:', error);
        toast.error('Error al subir la foto. El incidente se registrará sin foto.');
        // Continue without photo - incident is still valid
      }

      // Step 7: Create incident report in database
      const incidentData: IncidentReportInsert = {
        id: tempIncidentId,
        reservation_id: params.reservationId,
        reporter_id: params.userId,
        description: params.description,
        status: 'pending',
        offending_license_plate: sanitizedPlate,
        offending_user_id: offendingUserId,
        original_spot_id: params.originalSpotId,
        reassigned_spot_id: reassignmentResult.reassignedSpotId,
        reassigned_reservation_id: reassignedReservationId,
        photo_url: photoPath,
      };

      const { error: insertError } = await supabase
        .from('incident_reports')
        .insert(incidentData);

      if (insertError) {
        console.error('Error creating incident report:', insertError);
        
        // Clean up uploaded photo if incident creation failed
        if (photoPath) {
          try {
            await deleteIncidentPhoto(photoPath);
          } catch (cleanupError) {
            console.error('Error cleaning up photo:', cleanupError);
          }
        }

        toast.error('Error al crear el reporte de incidente');
        return {
          success: false,
          reassignedSpotId: null,
          reassignedSpotNumber: null,
          reassignedGroupId: null,
          groupName: null,
          positionX: null,
          positionY: null,
          floorPlanUrl: null,
          errorMessage: 'Error al crear el reporte',
        };
      }

      // Success!
      if (reassignmentResult.success) {
        toast.success('Incidente reportado y nueva plaza asignada');
      } else {
        toast.success('Incidente reportado. No hay plazas disponibles en este momento.');
      }

      return reassignmentResult;
    } catch (error) {
      console.error('Error in createIncidentReport:', error);
      toast.error('Error inesperado al crear el reporte');
      return {
        success: false,
        reassignedSpotId: null,
        reassignedSpotNumber: null,
        reassignedGroupId: null,
        groupName: null,
        positionX: null,
        positionY: null,
        floorPlanUrl: null,
        errorMessage: 'Error inesperado',
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancels an incident report and cleans up uploaded photo
   * Used when user cancels the flow before submission
   */
  const cancelIncidentReport = async () => {
    if (uploadedPhotoUrl) {
      try {
        await deleteIncidentPhoto(uploadedPhotoUrl);
        setUploadedPhotoUrl(null);
      } catch (error) {
        console.error('Error deleting photo during cancellation:', error);
        // Don't show error to user - cancellation should always succeed
      }
    }
  };

  return {
    isLoading,
    findUserByLicensePlate,
    findAvailableSpot,
    createReassignedReservation,
    createIncidentReport,
    cancelIncidentReport,
  };
};
