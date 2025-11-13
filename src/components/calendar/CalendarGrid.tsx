import { format, startOfMonth, eachDayOfInterval, endOfMonth, isBefore, startOfDay } from "date-fns";
import { DateCell } from "./DateCell";

interface Reservation {
  id: string;
  reservation_date: string;
  status: string;
  spot_id: string;
}

interface CalendarGridProps {
  currentMonth: Date;
  reservations: Reservation[];
  availableSpots: Record<string, number>;
  loadingSpots: boolean;
  onDayClick: (day: Date, reservation?: Reservation) => void;
}

export const CalendarGrid = ({ 
  currentMonth, 
  reservations, 
  availableSpots, 
  loadingSpots,
  onDayClick 
}: CalendarGridProps) => {
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const isReserved = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return reservations.some(r => r.reservation_date === dateStr);
  };

  const getReservation = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return reservations.find(r => r.reservation_date === dateStr);
  };

  const isPastDate = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const handleDayClick = (day: Date) => {
    const reserved = isReserved(day);
    const reservation = getReservation(day);
    const isPast = isPastDate(day);
    const dateStr = format(day, "yyyy-MM-dd");
    const available = availableSpots[dateStr] || 0;

    if (reserved && reservation && !isPast) {
      onDayClick(day, reservation);
    } else if (!reserved && available > 0 && !isPast) {
      onDayClick(day);
    }
  };

  return (
    <div className="grid grid-cols-7 gap-0.5 sm:gap-2 md:gap-3" data-calendar-grid>
      {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
        <div key={day} className="text-center font-bold text-[0.65rem] sm:text-sm text-gray-700 py-0.5 sm:py-2">
          {day}
        </div>
      ))}
      
      {/* Add empty cells for days before month starts */}
      {Array.from({ 
        length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 
      }).map((_, index) => (
        <div key={`empty-${index}`} />
      ))}
      
      {days.map((day) => {
        const reserved = isReserved(day);
        const dateStr = format(day, "yyyy-MM-dd");
        const available = availableSpots[dateStr] || 0;

        return (
          <DateCell
            key={day.toString()}
            day={day}
            currentMonth={currentMonth}
            reserved={reserved}
            available={available}
            loadingSpots={loadingSpots}
            onCellClick={() => handleDayClick(day)}
          />
        );
      })}
    </div>
  );
};
