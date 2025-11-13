import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * WarningCounter component
 * 
 * Displays the total number of warnings with color-coded visual indicators.
 * Features:
 * - Color coding: green (0), yellow (1-2), red (3+)
 * - Appropriate icons for each state
 * - Support for different sizes (sm, md, lg)
 * - Readable in light and dark mode
 * - Semantic HTML and ARIA labels
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.5
 */
const WarningCounter = ({ count, size = 'md' }: WarningCounterProps) => {
  // Determine color and icon based on count
  const getColorClasses = () => {
    if (count === 0) {
      return {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-300 dark:border-green-700",
        icon: CheckCircle,
      };
    } else if (count <= 2) {
      return {
        bg: "bg-yellow-100 dark:bg-yellow-950",
        text: "text-yellow-700 dark:text-yellow-300",
        border: "border-yellow-300 dark:border-yellow-700",
        icon: AlertCircle,
      };
    } else {
      return {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-300 dark:border-red-700",
        icon: AlertTriangle,
      };
    }
  };

  // Size variants
  const sizeClasses = {
    sm: {
      container: "p-3",
      number: "text-2xl",
      label: "text-xs",
      icon: "h-5 w-5",
    },
    md: {
      container: "p-4",
      number: "text-3xl",
      label: "text-sm",
      icon: "h-6 w-6",
    },
    lg: {
      container: "p-6",
      number: "text-4xl",
      label: "text-base",
      icon: "h-8 w-8",
    },
  };

  const { bg, text, border, icon: Icon } = getColorClasses();
  const sizes = sizeClasses[size];

  // Determine status message
  const getStatusMessage = () => {
    if (count === 0) {
      return "Sin amonestaciones";
    } else if (count === 1) {
      return "1 amonestación";
    } else {
      return `${count} amonestaciones`;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border-2",
        "flex flex-col items-center justify-center gap-2",
        "transition-colors",
        bg,
        border,
        sizes.container
      )}
      role="status"
      aria-label={getStatusMessage()}
    >
      {/* Icon */}
      <Icon 
        className={cn(sizes.icon, text)} 
        aria-hidden="true"
      />
      
      {/* Count */}
      <div className={cn("font-bold tabular-nums", sizes.number, text)}>
        {count}
      </div>
      
      {/* Label */}
      <div className={cn("font-medium text-center", sizes.label, text)}>
        Amonestaciones totales
      </div>
    </div>
  );
};

export default WarningCounter;
