import { useEffect, useState } from 'react';
import { useWaitlistSettings } from '@/hooks/useWaitlistSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle, Clock, Users, Shield, Ban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * AdminWaitlistConfig Component
 * 
 * Configuración global del sistema de lista de espera.
 * Permite a los administradores controlar todos los parámetros del sistema.
 * 
 * Configuraciones disponibles:
 * - Habilitar/deshabilitar sistema globalmente
 * - Tiempo de aceptación de ofertas (30-1440 minutos)
 * - Máximo de listas simultáneas por usuario (1-10)
 * - Prioridad por roles en la cola
 * - Sistema de penalización por no responder
 * - Umbral de penalización (2-10 no respuestas)
 * - Duración del bloqueo temporal (1-30 días)
 * 
 * Incluye validación en tiempo real y feedback visual de errores.
 */
export const AdminWaitlistConfig = () => {
  const { settings, loading, loadSettings, saveSettings, canModify } = useWaitlistSettings();
  
  // Form state
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [acceptanceTime, setAcceptanceTime] = useState(120);
  const [maxSimultaneous, setMaxSimultaneous] = useState(5);
  const [priorityByRole, setPriorityByRole] = useState(false);
  const [penaltyEnabled, setPenaltyEnabled] = useState(false);
  const [penaltyThreshold, setPenaltyThreshold] = useState(3);
  const [penaltyDuration, setPenaltyDuration] = useState(7);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setWaitlistEnabled(settings.waitlist_enabled);
      setAcceptanceTime(settings.waitlist_acceptance_time_minutes);
      setMaxSimultaneous(settings.waitlist_max_simultaneous);
      setPriorityByRole(settings.waitlist_priority_by_role);
      setPenaltyEnabled(settings.waitlist_penalty_enabled);
      setPenaltyThreshold(settings.waitlist_penalty_threshold);
      setPenaltyDuration(settings.waitlist_penalty_duration_days);
    }
  }, [settings]);

  // Real-time validation
  const validateField = (field: string, value: number): string | null => {
    switch (field) {
      case 'acceptanceTime':
        if (value < 30 || value > 1440) {
          return 'El tiempo de aceptación debe estar entre 30 y 1440 minutos (24 horas)';
        }
        break;
      case 'maxSimultaneous':
        if (value < 1 || value > 10) {
          return 'El máximo de listas simultáneas debe estar entre 1 y 10';
        }
        break;
      case 'penaltyThreshold':
        if (value < 2 || value > 10) {
          return 'El umbral de penalización debe estar entre 2 y 10';
        }
        break;
      case 'penaltyDuration':
        if (value < 1 || value > 30) {
          return 'La duración del bloqueo debe estar entre 1 y 30 días';
        }
        break;
    }
    return null;
  };

  const handleAcceptanceTimeChange = (value: string) => {
    const numValue = parseInt(value) || 30;
    setAcceptanceTime(numValue);
    const error = validateField('acceptanceTime', numValue);
    setErrors(prev => ({ ...prev, acceptanceTime: error || '' }));
  };

  const handleMaxSimultaneousChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setMaxSimultaneous(numValue);
    const error = validateField('maxSimultaneous', numValue);
    setErrors(prev => ({ ...prev, maxSimultaneous: error || '' }));
  };

  const handlePenaltyThresholdChange = (value: string) => {
    const numValue = parseInt(value) || 2;
    setPenaltyThreshold(numValue);
    const error = validateField('penaltyThreshold', numValue);
    setErrors(prev => ({ ...prev, penaltyThreshold: error || '' }));
  };

  const handlePenaltyDurationChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setPenaltyDuration(numValue);
    const error = validateField('penaltyDuration', numValue);
    setErrors(prev => ({ ...prev, penaltyDuration: error || '' }));
  };

  const hasErrors = Object.values(errors).some(error => error !== '');

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    const acceptanceTimeError = validateField('acceptanceTime', acceptanceTime);
    if (acceptanceTimeError) newErrors.acceptanceTime = acceptanceTimeError;
    
    const maxSimultaneousError = validateField('maxSimultaneous', maxSimultaneous);
    if (maxSimultaneousError) newErrors.maxSimultaneous = maxSimultaneousError;
    
    const penaltyThresholdError = validateField('penaltyThreshold', penaltyThreshold);
    if (penaltyThresholdError) newErrors.penaltyThreshold = penaltyThresholdError;
    
    const penaltyDurationError = validateField('penaltyDuration', penaltyDuration);
    if (penaltyDurationError) newErrors.penaltyDuration = penaltyDurationError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveSettings({
        waitlist_enabled: waitlistEnabled,
        waitlist_acceptance_time_minutes: acceptanceTime,
        waitlist_max_simultaneous: maxSimultaneous,
        waitlist_priority_by_role: priorityByRole,
        waitlist_penalty_enabled: penaltyEnabled,
        waitlist_penalty_threshold: penaltyThreshold,
        waitlist_penalty_duration_days: penaltyDuration
      });

      if (success) {
        // Forzar recarga para obtener datos actualizados
        await loadSettings(true);
      }
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSaving(false);
    }
  };

  // Helper para convertir minutos a formato legible
  const formatAcceptanceTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutos`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    return `${hours}h ${mins}m`;
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Lista de Espera</CardTitle>
          <CardDescription>
            Configura el comportamiento global del sistema de lista de espera para plazas de parking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Enable/Disable */}
          <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="waitlist-enabled" className="text-base font-medium">
                Activar lista de espera
              </Label>
              <p className="text-sm text-muted-foreground">
                Habilita o deshabilita el sistema completo de lista de espera
              </p>
            </div>
            <Switch
              id="waitlist-enabled"
              checked={waitlistEnabled}
              onCheckedChange={setWaitlistEnabled}
              disabled={!canModify}
            />
          </div>

          {/* Acceptance Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="acceptance-time">
                Tiempo de aceptación de ofertas
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Tiempo que tiene un usuario para aceptar una oferta de plaza (30-1440 minutos)
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="acceptance-time"
                type="number"
                min={30}
                max={1440}
                value={acceptanceTime}
                onChange={(e) => handleAcceptanceTimeChange(e.target.value)}
                className={errors.acceptanceTime ? 'border-destructive' : ''}
                disabled={!canModify}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatAcceptanceTime(acceptanceTime)}
              </span>
            </div>
            {errors.acceptanceTime && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.acceptanceTime}
              </p>
            )}
          </div>

          {/* Max Simultaneous */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="max-simultaneous">
                Máximo de listas simultáneas por usuario
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Número máximo de listas de espera en las que un usuario puede estar registrado (1-10)
            </p>
            <Input
              id="max-simultaneous"
              type="number"
              min={1}
              max={10}
              value={maxSimultaneous}
              onChange={(e) => handleMaxSimultaneousChange(e.target.value)}
              className={errors.maxSimultaneous ? 'border-destructive' : ''}
              disabled={!canModify}
            />
            {errors.maxSimultaneous && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.maxSimultaneous}
              </p>
            )}
          </div>

          {/* Priority by Role */}
          <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="priority-by-role" className="text-base font-medium">
                  Prioridad por roles
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Los usuarios con roles de mayor prioridad (director, preferred) reciben ofertas antes
              </p>
            </div>
            <Switch
              id="priority-by-role"
              checked={priorityByRole}
              onCheckedChange={setPriorityByRole}
              disabled={!canModify}
            />
          </div>

          {/* Penalty System */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="penalty-enabled" className="text-base font-medium">
                    Sistema de penalización
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Penaliza a usuarios que no responden ofertas repetidamente
                </p>
              </div>
              <Switch
                id="penalty-enabled"
                checked={penaltyEnabled}
                onCheckedChange={setPenaltyEnabled}
                disabled={!canModify}
              />
            </div>

            {penaltyEnabled && (
              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="penalty-threshold">
                    Umbral de penalización
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Número de no respuestas antes de bloquear temporalmente (2-10)
                  </p>
                  <Input
                    id="penalty-threshold"
                    type="number"
                    min={2}
                    max={10}
                    value={penaltyThreshold}
                    onChange={(e) => handlePenaltyThresholdChange(e.target.value)}
                    className={errors.penaltyThreshold ? 'border-destructive' : ''}
                    disabled={!canModify}
                  />
                  {errors.penaltyThreshold && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.penaltyThreshold}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penalty-duration">
                    Duración del bloqueo (días)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Días que un usuario permanece bloqueado (1-30)
                  </p>
                  <Input
                    id="penalty-duration"
                    type="number"
                    min={1}
                    max={30}
                    value={penaltyDuration}
                    onChange={(e) => handlePenaltyDurationChange(e.target.value)}
                    className={errors.penaltyDuration ? 'border-destructive' : ''}
                    disabled={!canModify}
                  />
                  {errors.penaltyDuration && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.penaltyDuration}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Los cambios se aplicarán inmediatamente. Los usuarios verán las opciones de lista de espera 
              solo cuando el sistema esté habilitado y no haya plazas disponibles.
            </AlertDescription>
          </Alert>

          {!canModify && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No puedes modificar la configuración sin conexión a internet.
              </AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || hasErrors || !canModify}
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
