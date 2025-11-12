import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import ReservationDetailsModal from "./ReservationDetailsModal";
import GroupSelectorModal from "./GroupSelectorModal";
import { MonthNavigation } from "./calendar/MonthNavigation";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { CalendarLegend } from "./calendar/CalendarLegend";
import { useParkingCalendar } from "@/hooks/useParkingCalendar";

interface ParkingCalendarProps {
  userId: string;
  userRole: string;
}

const ParkingCalendar = ({ userId, userRole }: ParkingCalendarProps) => {
  const {
    currentMonth,
    setCurrentMonth,
    reservations,
    availableSpots,
    loading,
    loadingSpots,
    userGroups,
    userGroupNames,
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
    loadReservationDetails,
    handleEditReservation,
    handleCancel,
    refreshData,
  } = useParkingCalendar(userId);

  const handleDayClick = (day: Date, reservation?: any) => {
    if (reservation) {
      loadReservationDetails(reservation.id);
    } else {
      handleReserve(day);
    }
  };

  return (
    <div className="space-y-6">
      {userGroups.length === 0 && !loading && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                No tienes acceso a ningún grupo de parking
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Contacta con el administrador para que te asigne acceso a los grupos correspondientes
              </p>
            </div>
          </div>
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
        onCancel={() => setShowGroupSelector(false)}
      />

      <ReservationDetailsModal
        isOpen={showReservationDetails}
        reservation={selectedReservationDetails}
        onCancel={handleCancel}
        onEdit={handleEditReservation}
        onClose={() => {
          setShowReservationDetails(false);
          setSelectedReservationDetails(null);
        }}
        onIncidentReported={refreshData}
      />
    </div>
  );
};

export default ParkingCalendar;
