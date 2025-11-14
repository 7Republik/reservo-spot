import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WifiOff } from "lucide-react";

interface DisabledControlTooltipProps {
  children: React.ReactNode;
  isDisabled: boolean;
  message?: string;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Componente wrapper que muestra un tooltip explicativo cuando un control está deshabilitado.
 * Diseñado específicamente para indicar que se requiere conexión a internet.
 * 
 * @param children - El control a envolver (botón, input, etc.)
 * @param isDisabled - Si el control está deshabilitado (típicamente !isOnline)
 * @param message - Mensaje personalizado (default: "Requiere conexión a internet")
 * @param side - Posición del tooltip (default: "top")
 * 
 * @example
 * ```tsx
 * <DisabledControlTooltip isDisabled={!isOnline}>
 *   <Button disabled={!isOnline} onClick={handleReserve}>
 *     Reservar
 *   </Button>
 * </DisabledControlTooltip>
 * ```
 */
export const DisabledControlTooltip = ({
  children,
  isDisabled,
  message = "Requiere conexión a internet",
  side = "top",
}: DisabledControlTooltipProps) => {
  // Si no está deshabilitado, solo renderizar el children sin tooltip
  if (!isDisabled) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span>{message}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
