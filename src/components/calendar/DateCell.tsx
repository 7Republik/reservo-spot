import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { format, isSameMonth, isToday, isBefore, startOfDay } from "date-fns";

interface DateCellProps {
  day: Date;
  currentMonth: Date;
  reserved: boolean;
  available: number;
  loadingSpots: boolean;
  onCellClick: () => void;
}

export const DateCell = ({ 
  day, 
  currentMonth, 
  reserved, 
  available, 
  loadingSpots,
  onCellClick 
}: DateCellProps) => {
  const dateStr = format(day, "yyyy-MM-dd");
  const isPast = isBefore(day, startOfDay(new Date()));

  return (
    <Card
      data-date={dateStr}
      className={`group relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg min-h-[70px] sm:min-h-[90px] md:min-h-[100px] flex flex-col justify-between cursor-pointer ${
        !isSameMonth(day, currentMonth) ? "opacity-30" : ""
      } ${isToday(day) ? "ring-2 ring-blue-500 shadow-md" : ""} ${
        reserved ? "bg-emerald-50 border-emerald-500" : 
        available > 0 && !isPast ? "hover:border-blue-300 hover:shadow-md" : ""
      } ${isPast ? "opacity-40 cursor-not-allowed" : ""}`}
      onClick={onCellClick}
      role="button"
      aria-label={`Día ${format(day, "d")}, ${available} plazas disponibles`}
      aria-pressed={reserved}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCellClick();
        }
      }}
    >
      {/* Fondo con gradiente suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      {/* Contenido principal */}
      <div className="relative z-10 p-1 sm:p-2 md:p-3 flex flex-col h-full">
        {/* Número del día */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-base sm:text-lg md:text-xl font-bold ${
            isToday(day) ? "text-blue-600" : 
            reserved ? "text-emerald-700" : 
            "text-gray-900"
          }`}>
            {format(day, "d")}
          </span>
          {/* Icono de estado */}
          {reserved && (
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
          )}
        </div>
        
        {/* Indicador de disponibilidad */}
        <div className="mt-auto">
          {/* Mostrar skeleton mientras carga */}
          {loadingSpots && !reserved && !isPast && (
            <div className="flex items-center gap-0.5 sm:gap-1 animate-pulse">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300" />
              <div className="h-3 w-6 bg-gray-200 rounded" />
            </div>
          )}
          
          {/* Mostrar disponibilidad real solo cuando terminó de cargar */}
          {!loadingSpots && !isPast && !reserved && available > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="text-[0.6rem] sm:text-xs font-medium text-emerald-700">
                {available}
              </span>
            </div>
          )}
          {!loadingSpots && available === 0 && !isPast && !reserved && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" aria-hidden="true" />
              <span className="text-[0.6rem] sm:text-xs font-medium text-red-700">
                No
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
