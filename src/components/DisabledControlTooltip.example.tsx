import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisabledControlTooltip } from "./DisabledControlTooltip";

/**
 * Ejemplos de uso del componente DisabledControlTooltip
 * 
 * Este archivo muestra diferentes casos de uso del componente wrapper
 * para controles deshabilitados en modo offline.
 */

// Ejemplo 1: Botón de acción deshabilitado
export const ExampleDisabledButton = ({ isOnline }: { isOnline: boolean }) => {
  return (
    <DisabledControlTooltip isDisabled={!isOnline}>
      <Button 
        disabled={!isOnline}
        onClick={() => console.log("Reservar")}
      >
        Reservar Plaza
      </Button>
    </DisabledControlTooltip>
  );
};

// Ejemplo 2: Input deshabilitado con mensaje personalizado
export const ExampleDisabledInput = ({ isOnline }: { isOnline: boolean }) => {
  return (
    <DisabledControlTooltip 
      isDisabled={!isOnline}
      message="No puedes añadir placas sin conexión"
      side="right"
    >
      <Input 
        disabled={!isOnline}
        placeholder="Matrícula del vehículo"
      />
    </DisabledControlTooltip>
  );
};

// Ejemplo 3: Botón de cancelación
export const ExampleCancelButton = ({ isOnline }: { isOnline: boolean }) => {
  return (
    <DisabledControlTooltip 
      isDisabled={!isOnline}
      message="No puedes cancelar reservas sin conexión"
    >
      <Button 
        disabled={!isOnline}
        variant="destructive"
        onClick={() => console.log("Cancelar")}
      >
        Cancelar Reserva
      </Button>
    </DisabledControlTooltip>
  );
};

// Ejemplo 4: Múltiples botones en un formulario
export const ExampleFormButtons = ({ isOnline }: { isOnline: boolean }) => {
  return (
    <div className="flex gap-4">
      <DisabledControlTooltip isDisabled={!isOnline}>
        <Button 
          disabled={!isOnline}
          onClick={() => console.log("Guardar")}
        >
          Guardar
        </Button>
      </DisabledControlTooltip>

      <DisabledControlTooltip 
        isDisabled={!isOnline}
        message="No puedes eliminar sin conexión"
      >
        <Button 
          disabled={!isOnline}
          variant="destructive"
          onClick={() => console.log("Eliminar")}
        >
          Eliminar
        </Button>
      </DisabledControlTooltip>
    </div>
  );
};

// Ejemplo 5: Control que solo se deshabilita offline (no siempre)
export const ExampleConditionalDisable = ({ 
  isOnline, 
  hasLicensePlate 
}: { 
  isOnline: boolean;
  hasLicensePlate: boolean;
}) => {
  const isDisabled = !isOnline || !hasLicensePlate;
  
  // El tooltip solo aparece cuando está offline
  // Si está deshabilitado por otra razón, no muestra el tooltip de conexión
  return (
    <DisabledControlTooltip isDisabled={!isOnline}>
      <Button 
        disabled={isDisabled}
        onClick={() => console.log("Reservar")}
      >
        Reservar Plaza
      </Button>
    </DisabledControlTooltip>
  );
};

// Ejemplo 6: Uso en componente de check-in
export const ExampleCheckinButton = ({ isOnline }: { isOnline: boolean }) => {
  return (
    <DisabledControlTooltip 
      isDisabled={!isOnline}
      message="Requiere conexión para validar horarios"
      side="bottom"
    >
      <Button 
        disabled={!isOnline}
        onClick={() => console.log("Check-in")}
        className="w-full"
      >
        Hacer Check-in
      </Button>
    </DisabledControlTooltip>
  );
};
