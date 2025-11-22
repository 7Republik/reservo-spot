/**
 * Ejemplo de uso del hook useLicensePlateManager con modo offline
 * 
 * Este ejemplo muestra cómo el hook gestiona automáticamente:
 * - Carga desde cache cuando offline
 * - Carga desde servidor cuando online
 * - Cacheo automático de datos
 * - Deshabilitación de botones cuando offline
 * - Tooltips explicativos
 */

import { useLicensePlateManager } from "./useLicensePlateManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DisabledControlTooltip } from "@/components/DisabledControlTooltip";
import { CachedDataIndicator } from "@/components/CachedDataIndicator";

export const LicensePlateManagerExample = ({ userId }: { userId: string }) => {
  const {
    activePlates,
    newPlate,
    setNewPlate,
    loading,
    handleAddPlate,
    openDeleteDialog,
    isOnline,
    lastSyncTime,
  } = useLicensePlateManager(userId);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Indicador de datos cacheados */}
      <CachedDataIndicator 
        lastSyncTime={lastSyncTime} 
        isOnline={isOnline}
      />

      {/* Formulario de añadir matrícula */}
      <div className="flex gap-2">
        <Input
          placeholder="1234ABC"
          value={newPlate}
          onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
          disabled={!isOnline} // Deshabilitado cuando offline
        />
        
        {/* Botón con tooltip cuando offline */}
        <DisabledControlTooltip
          isDisabled={!isOnline}
          message="Requiere conexión a internet"
        >
          <Button 
            onClick={handleAddPlate}
            disabled={!newPlate.trim() || !isOnline}
          >
            Añadir
          </Button>
        </DisabledControlTooltip>
      </div>

      {/* Lista de matrículas */}
      <div className="space-y-2">
        {activePlates.map((plate) => (
          <div key={plate.id} className="flex items-center justify-between p-3 border rounded">
            <span className="font-mono font-bold">{plate.plate_number}</span>
            
            {/* Botón eliminar con tooltip cuando offline */}
            <DisabledControlTooltip
              isDisabled={!isOnline}
              message="Requiere conexión a internet"
            >
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openDeleteDialog(plate)}
                disabled={!isOnline}
              >
                Eliminar
              </Button>
            </DisabledControlTooltip>
          </div>
        ))}
      </div>

      {/* Comportamiento del hook */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Modo Offline:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>✅ Ver matrículas desde cache</li>
          <li>❌ Añadir nuevas matrículas (bloqueado)</li>
          <li>❌ Eliminar matrículas (bloqueado)</li>
          <li>✅ Tooltips explicativos en botones deshabilitados</li>
          <li>✅ Recarga automática al recuperar conexión</li>
        </ul>
      </div>
    </div>
  );
};
