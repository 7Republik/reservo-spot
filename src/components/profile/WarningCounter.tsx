import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * WarningCounter component - Diseño moderno y minimalista
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
        bg: "bg-green-100 dark:bg-green-900/40",
        text: "text-green-800 dark:text-green-200",
        border: "border-green-200 dark:border-green-700",
        icon: CheckCircle,
      };
    } else if (count <= 2) {
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/40",
        text: "text-yellow-800 dark:text-yellow-200",
        border: "border-yellow-200 dark:border-yellow-700",
        icon: AlertCircle,
      };
    } else {
      return {
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-800 dark:text-red-200",
        border: "border-red-200 dark:border-red-700",
        icon: AlertTriangle,
      };
    }
  };

  // Size variants
  const sizeClasses = {
    sm: {
      container: "px-3 py-2 gap-2",
      number: "text-lg",
      label: "text-xs",
      icon: "h-4 w-4",
    },
    md: {
      container: "px-4 py-2.5 gap-2.5",
      number: "text-xl",
      label: "text-sm",
      icon: "h-5 w-5",
    },
    lg: {
      container: "px-5 py-3 gap-3",
      number: "text-2xl",
      label: "text-base",
      icon: "h-6 w-6",
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

  // Size variants para diseño circular
  const circleSizes = {
    sm: {
      container: "w-20 h-20",
      number: "text-2xl",
      label: "text-xs",
      icon: "h-5 w-5",
    },
    md: {
      container: "w-24 h-24",
      number: "text-3xl",
      label: "text-sm",
      icon: "h-6 w-6",
    },
    lg: {
      container: "w-32 h-32",
      number: "text-4xl",
      label: "text-base",
      icon: "h-8 w-8",
    },
  };

  const circleSize = circleSizes[size];

  return (
    <div
      className={cn(
        "rounded-full",
        "flex flex-col items-center justify-center gap-1",
        "transition-all duration-200",
        "shadow-md border-2",
        bg,
        border,
        circleSize.container
      )}
      role="status"
      aria-label={getStatusMessage()}
    >
      {/* Icon */}
      <Icon 
        className={cn(circleSize.icon, text, "mb-0.5")} 
        aria-hidden="true"
      />
      
      {/* Count */}
      <div className={cn("font-bold tabular-nums leading-none", circleSize.number, text)}>
        {count}
      </div>
      
      {/* Label */}
      <div className={cn("font-medium leading-none", circleSize.label, text)}>
        Avisos
      </div>
    </div>
  );
};

export default WarningCounter;
