export const MapLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 px-1 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-emerald-500 animate-pulse" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
          Disponible
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-blue-500" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
          ♿ PMR
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-yellow-500" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
          ⚡ Cargador
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-red-500" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
          Ocupada
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-blue-50 border border-blue-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-blue-600" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-blue-700 whitespace-nowrap">
          Tu reserva
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded bg-gray-300" />
        <span className="text-[0.65rem] sm:text-xs font-medium text-gray-700 whitespace-nowrap">
          No disponible
        </span>
      </div>
    </div>
  );
};
