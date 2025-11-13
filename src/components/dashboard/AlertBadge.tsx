import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBadgeProps {
  count: number;
  onClick: () => void;
}

/**
 * AlertBadge component
 * 
 * Displays a visual indicator for unviewed warnings in the dashboard header.
 * Features:
 * - Shows count of unviewed warnings
 * - Pulse animation for new alerts
 * - Hidden when count is 0
 * - Click handler to navigate to warnings section
 * - Accessible with ARIA labels
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 8.3
 */
const AlertBadge = ({ count, onClick }: AlertBadgeProps) => {
  // Hide badge when count is 0
  if (count === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center",
        "h-9 w-9 sm:h-10 sm:w-10",
        "rounded-full",
        "bg-background",
        "border border-border",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "min-h-[44px] min-w-[44px]" // Minimum touch target size for accessibility
      )}
      aria-label={`${count} amonestación${count !== 1 ? "es" : ""} sin revisar`}
      aria-live="polite"
      type="button"
    >
      {/* Bell icon */}
      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
      
      {/* Badge with count */}
      <Badge
        variant="destructive"
        className={cn(
          "absolute -top-1 -right-1",
          "h-5 w-5 sm:h-6 sm:w-6",
          "flex items-center justify-center",
          "p-0",
          "text-[10px] sm:text-xs font-semibold",
          "rounded-full",
          "animate-pulse" // Pulse animation for new alerts
        )}
        aria-hidden="true" // Hide from screen readers (count is in button aria-label)
      >
        {count > 9 ? "9+" : count}
      </Badge>
    </button>
  );
};

export default AlertBadge;
