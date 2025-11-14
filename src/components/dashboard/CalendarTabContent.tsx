import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "lucide-react";
import { TodaySection } from "./TodaySection";
import ParkingCalendar from "@/components/ParkingCalendar";
import { IncidentReportFlow } from "@/components/incidents/IncidentReportFlow";

interface CalendarTabContentProps {
  userId: string;
  userRole: string;
}

/**
 * Contenedor del tab de calendario
 * Maneja la sincronización entre la sección HOY y el calendario
 */
export const CalendarTabContent = ({ userId, userRole }: CalendarTabContentProps) => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // Función para forzar actualización de la sección HOY
  const handleReservationUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Navegar a la página de visualización de ubicación
  const handleViewLocation = useCallback((reservation: any) => {
    navigate("/view-spot-location", {
      state: {
        spotId: reservation.spotId,
        spotNumber: reservation.spotNumber,
        groupName: reservation.groupName,
        date: new Date().toISOString(),
        isAccessible: reservation.isAccessible,
        hasCharger: reservation.hasCharger,
        isCompact: reservation.isCompact,
      }
    });
  }, [navigate]);

  // Abrir modal de reporte de incidencia
  const handleReportIncident = useCallback((reservation: any) => {
    setSelectedReservation(reservation);
    setIncidentDialogOpen(true);
  }, []);

  // Cerrar modal y refrescar
  const handleIncidentComplete = useCallback(() => {
    setIncidentDialogOpen(false);
    setSelectedReservation(null);
    handleReservationUpdate();
  }, [handleReservationUpdate]);

  // Cancelar reporte
  const handleIncidentCancel = useCallback(() => {
    setIncidentDialogOpen(false);
    setSelectedReservation(null);
  }, []);

  // Ver ubicación desde el reporte de incidente
  const handleViewLocationFromIncident = useCallback(() => {
    if (selectedReservation) {
      setIncidentDialogOpen(false);
      handleViewLocation(selectedReservation);
      setSelectedReservation(null);
    }
  }, [selectedReservation, handleViewLocation]);

  return (
    <>
      <TodaySection
        userId={userId}
        refreshTrigger={refreshTrigger}
        onViewDetails={handleViewLocation}
        onReportIncident={handleReportIncident}
        onReservationUpdate={handleReservationUpdate}
      />
      
      <Card>
        <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Reservar Plaza de Aparcamiento
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Selecciona un día para reservar tu plaza de aparcamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
          <ParkingCalendar 
            key={refreshTrigger} 
            userId={userId} 
            userRole={userRole}
            onReservationUpdate={handleReservationUpdate}
          />
        </CardContent>
      </Card>

      {/* Modal de Reporte de Incidencia */}
      <Dialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          {selectedReservation && (
            <IncidentReportFlow
              reservationId={selectedReservation.id}
              spotId={selectedReservation.spotId}
              spotNumber={selectedReservation.spotNumber}
              groupName={selectedReservation.groupName}
              reservationDate={selectedReservation.reservation_date}
              userId={userId}
              onComplete={handleIncidentComplete}
              onCancel={handleIncidentCancel}
              onViewLocation={handleViewLocationFromIncident}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
