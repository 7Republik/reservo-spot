import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { TodaySection } from "./TodaySection";
import ParkingCalendar from "@/components/ParkingCalendar";

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

  return (
    <>
      <TodaySection
        userId={userId}
        refreshTrigger={refreshTrigger}
        onViewDetails={handleViewLocation}
        onReportIncident={(reservation) => {
          // Mismo comportamiento que ver ubicación - abre el modal de detalles
          handleViewLocation(reservation);
        }}
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
            userId={userId} 
            userRole={userRole}
            onReservationUpdate={handleReservationUpdate}
          />
        </CardContent>
      </Card>
    </>
  );
};
