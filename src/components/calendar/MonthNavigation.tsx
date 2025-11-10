import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface MonthNavigationProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export const MonthNavigation = ({ currentMonth, onMonthChange }: MonthNavigationProps) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
        onClick={() => onMonthChange(subMonths(currentMonth, 1))}
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
      
      <div className="px-3 py-2 sm:px-6 sm:py-3 rounded-full bg-gray-100">
        <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 tracking-tight capitalize">
          {format(currentMonth, "MMM yyyy", { locale: es })}
        </h2>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
        onClick={() => onMonthChange(addMonths(currentMonth, 1))}
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
};
