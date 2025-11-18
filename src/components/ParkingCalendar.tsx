import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import ReservationDetailsModal from "./ReservationDetailsModal";
import GroupSelectorModal from "./GroupSelectorModal";
import { MonthNavigation } from "./calendar/MonthNavigation";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { CalendarLegend } from "./calendar/CalendarLegend";
import { CachedDataIndicator } from "./CachedDataIndicator";
import { useParkingCalendar } from "@/hooks/useParkingCalendar";

interface ParkingCalendarProps {
  userId: string;
  userRole: string;
  onReservationUpdate?: () => void;
}

const ParkingCalendar = ({ userId, onReservationUpdate }: ParkingCalendarProps) => {
  const {
    currentMonth,
    setCurrentMonth,
    reservations,
    availableSpots,
    loading,
    loadingSpots,
    userGroups,
    selectedDateForMap,
    showGroupSelector,
    setShowGroupSelector,
    showReservationDetails,
    setShowReservationDetails,
    selectedReservationDetails,
    setSelectedReservationDetails,
    handleReserve,
    handleGroupSelected,
    handleQuickReserve,
    handleJoinWaitlist,
    loadReservationDetails,
    handleEditReservation,
    handleCancel,
    refreshData,
    isOnline,
    lastSyncTime,
  } = useParkingCalendar(userId, onReservationUpdate);

  const handleDayClick = (day: Date, reservation?: any) => {
    if (reservation) {
      loadReservationDetails(reservation.id);
    } else {
      handleReserve(day);
    }
  };

  const handleCancelWithUpdate = async (reservationId: string) => {
    await handleCancel(reservationId);
    if (onReservationUpdate) {
      onReservationUpdate();
    }
  };

  const handleRefreshWithUpdate = async () => {
    await refreshData();
    if (onReservationUpdate) {
      onReservationUpdate();
    }
  };

  return (
    <div className="space-y-4">
      {/* Indicador de datos cacheados */}
      <CachedDataIndicator 
        lastSyncTime={lastSyncTime} 
        isOnline={isOnline}
      />

      {/* Advertencia de sin acceso a grupos */}
      {userGroups.length === 0 && !loading && (
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  No tienes acceso a ningún grupo de parking
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Contacta con el administrador para que te asigne acceso a los grupos correspondientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MonthNavigation 
        currentMonth={currentMonth} 
        onMonthChange={setCurrentMonth} 
      />

      <CalendarGrid
        currentMonth={currentMonth}
        reservations={reservations}
        availableSpots={availableSpots}
        loadingSpots={loadingSpots}
        onDayClick={handleDayClick}
      />

      <CalendarLegend />

      <GroupSelectorModal
        isOpen={showGroupSelector}
        selectedDate={selectedDateForMap}
        userGroups={userGroups}
        userId={userId}
        onGroupSelected={handleGroupSelected}
        onQuickReserve={handleQuickReserve}
        onJoinWaitlist={handleJoinWaitlist}
        onCancel={() => setShowGroupSelector(false)}
      />

      <ReservationDetailsModal
        isOpen={showReservationDetails}
        reservation={selectedReservationDetails}
        onCancel={handleCancelWithUpdate}
        onEdit={handleEditReservation}
        onClose={() => {
          setShowReservationDetails(false);
          setSelectedReservationDetails(null);
        }}
        onIncidentReported={handleRefreshWithUpdate}
      />
    </div>
  );
};

export default ParkingCalendar;
