import { CheckCircle2 } from "lucide-react";

export const CalendarLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">Disponible</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-emerald-50 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-emerald-700 whitespace-nowrap">Tu reserva</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">Completo</span>
      </div>
    </div>
  );
};
