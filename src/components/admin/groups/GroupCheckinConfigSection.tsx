import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Settings2 } from "lucide-react";
import { useGroupCheckinConfig } from '@/hooks/admin/useGroupCheckinConfig';
import { useCheckinSettings } from '@/hooks/admin/useCheckinSettings';
import { Skeleton } from "@/components/ui/skeleton";

interface GroupCheckinConfigSectionProps {
  groupId: string;
  groupName: string;
}

/**
 * Componente para configurar el sistema de check-in/check-out por grupo de parking
 * 
 * Permite a los administradores:
 * - Activar/desactivar check-in para el grupo específico
 * - Elegir entre configuración global o personalizada
 * - Configurar ventana de check-in personalizada (1-24 horas)
 * 
 * Muestra indicadores visuales de:
 * - Si el grupo usa configuración global o personalizada
 * - Los valores actuales de configuración
 * 
 * @param {string} groupId - UUID del grupo de parking
 * @param {string} groupName - Nombre del grupo para mostrar en UI
 */
export const GroupCheckinConfigSection = ({
  groupId,
  groupName
}: GroupCheckinConfigSectionProps) => {
  const { config, loading: configLoading, loadGroupConfig, updateGroupConfig } = useGroupCheckinConfig();
  const { settings: globalSettings, loading: settingsLoading, loadSettings } = useCheckinSettings();
  
  // Estado local para edición
  const [enabled, setEnabled] = useState(true);
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [customWindow, setCustomWindow] = useState(24);

  // Cargar configuración al montar
  useEffect(() => {
    loadGroupConfig(groupId);
    loadSettings();
  }, [groupId]);

  // Sincronizar estado local con configuración cargada
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setUseCustomConfig(config.use_custom_config);
      setCustomWindow(config.custom_checkin_window_hours || 24);
    } else {
      // Si no hay configuración, usar valores por defecto
      setEnabled(true);
      setUseCustomConfig(false);
      setCustomWindow(24);
    }
  }, [config]);

  const handleToggleEnabled = async (checked: boolean) => {
    setEnabled(checked);
    try {
      await updateGroupConfig(groupId, { enabled: checked });
    } catch (err) {
      // Revertir en caso de error
      setEnabled(!checked);
    }
  };

  const handleToggleCustomConfig = async (checked: boolean) => {
    setUseCustomConfig(checked);
    try {
      await updateGroupConfig(groupId, { 
        use_custom_config: checked,
        custom_checkin_window_hours: checked ? customWindow : null
      });
    } catch (err) {
      // Revertir en caso de error
      setUseCustomConfig(!checked);
    }
  };

  const handleCustomWindowChange = async (value: string) => {
    const numValue = parseInt(value);
    
    // Validar rango (1-24 horas)
    if (isNaN(numValue) || numValue < 1 || numValue > 24) {
      return;
    }

    setCustomWindow(numValue);
    
    // Solo actualizar si está usando configuración personalizada
    if (useCustomConfig) {
      try {
        await updateGroupConfig(groupId, { 
          custom_checkin_window_hours: numValue 
        });
      } catch (err) {
        // El error ya se muestra en el hook
      }
    }
  };

  // Calcular ventana efectiva (personalizada o global)
  const effectiveWindow = useCustomConfig 
    ? customWindow 
    : (globalSettings?.default_checkin_window_hours || 24);

  if (configLoading || settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Configuración de Check-in
        </CardTitle>
        <CardDescription>
          Configura el sistema de check-in/check-out para {groupName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle para activar/desactivar check-in en el grupo */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor={`checkin-enabled-${groupId}`}>
              Sistema de Check-in
            </Label>
            <p className="text-sm text-muted-foreground">
              {enabled 
                ? 'Los usuarios deben hacer check-in al llegar' 
                : 'Check-in desactivado para este grupo'}
            </p>
          </div>
          <Switch
            id={`checkin-enabled-${groupId}`}
            checked={enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        {/* Solo mostrar opciones adicionales si el check-in está activado */}
        {enabled && (
          <>
            {/* Toggle para usar configuración personalizada */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={`custom-config-${groupId}`} className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Configuración Personalizada
                </Label>
                <p className="text-sm text-muted-foreground">
                  {useCustomConfig 
                    ? 'Usando ventana de check-in personalizada' 
                    : 'Usando configuración global del sistema'}
                </p>
              </div>
              <Switch
                id={`custom-config-${groupId}`}
                checked={useCustomConfig}
                onCheckedChange={handleToggleCustomConfig}
              />
            </div>

            {/* Input para ventana de check-in personalizada */}
            {useCustomConfig && (
              <div className="space-y-2 pl-6 border-l-2 border-primary/20">
                <Label htmlFor={`custom-window-${groupId}`}>
                  Ventana de Check-in Personalizada
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id={`custom-window-${groupId}`}
                    type="number"
                    min="1"
                    max="24"
                    value={customWindow}
                    onChange={(e) => handleCustomWindowChange(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los usuarios tendrán {customWindow} {customWindow === 1 ? 'hora' : 'horas'} para hacer check-in
                </p>
              </div>
            )}

            {/* Indicador visual de configuración activa */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Configuración Activa</span>
                <Badge variant={useCustomConfig ? "default" : "secondary"}>
                  {useCustomConfig ? 'Personalizada' : 'Global'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Ventana de check-in:</strong> {effectiveWindow} {effectiveWindow === 1 ? 'hora' : 'horas'}
                </p>
                {globalSettings && (
                  <p>
                    <strong>Periodo de gracia:</strong> {globalSettings.grace_period_minutes} minutos
                  </p>
                )}
              </div>
              {!useCustomConfig && globalSettings && (
                <p className="text-xs text-muted-foreground italic">
                  Esta configuración se hereda de la configuración global del sistema
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
