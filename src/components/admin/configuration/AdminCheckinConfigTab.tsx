import { useEffect, useState } from 'react';
import { useCheckinSettings } from '@/hooks/admin/useCheckinSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AdminCheckinConfigTab = () => {
  const { settings, loading, loadSettings, updateSettings } = useCheckinSettings();
  
  // Form state
  const [systemEnabled, setSystemEnabled] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(60);
  const [checkinThreshold, setCheckinThreshold] = useState(3);
  const [checkoutThreshold, setCheckoutThreshold] = useState(3);
  const [blockDays, setBlockDays] = useState(7);
  const [sendReminders, setSendReminders] = useState(true);
  
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
      setSystemEnabled(settings.system_enabled);
      setGracePeriod(settings.grace_period_minutes);
      setCheckinThreshold(settings.checkin_infraction_threshold);
      setCheckoutThreshold(settings.checkout_infraction_threshold);
      setBlockDays(settings.temporary_block_days);
      setSendReminders(settings.send_checkin_reminders);
    }
  }, [settings]);

  // Real-time validation
  const validateField = (field: string, value: number): string | null => {
    switch (field) {
      case 'gracePeriod':
        if (value < 0 || value > 120) {
          return 'El periodo de gracia debe estar entre 0 y 120 minutos';
        }
        break;
      case 'checkinThreshold':
      case 'checkoutThreshold':
        if (value < 1 || value > 20) {
          return 'El umbral debe estar entre 1 y 20 infracciones';
        }
        break;
      case 'blockDays':
        if (value < 1 || value > 90) {
          return 'La duración del bloqueo debe estar entre 1 y 90 días';
        }
        break;
    }
    return null;
  };

  const handleGracePeriodChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setGracePeriod(numValue);
    const error = validateField('gracePeriod', numValue);
    setErrors(prev => ({ ...prev, gracePeriod: error || '' }));
  };

  const handleCheckinThresholdChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setCheckinThreshold(numValue);
    const error = validateField('checkinThreshold', numValue);
    setErrors(prev => ({ ...prev, checkinThreshold: error || '' }));
  };

  const handleCheckoutThresholdChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setCheckoutThreshold(numValue);
    const error = validateField('checkoutThreshold', numValue);
    setErrors(prev => ({ ...prev, checkoutThreshold: error || '' }));
  };

  const handleBlockDaysChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    setBlockDays(numValue);
    const error = validateField('blockDays', numValue);
    setErrors(prev => ({ ...prev, blockDays: error || '' }));
  };

  const hasErrors = Object.values(errors).some(error => error !== '');

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    const gracePeriodError = validateField('gracePeriod', gracePeriod);
    if (gracePeriodError) newErrors.gracePeriod = gracePeriodError;
    
    const checkinThresholdError = validateField('checkinThreshold', checkinThreshold);
    if (checkinThresholdError) newErrors.checkinThreshold = checkinThresholdError;
    
    const checkoutThresholdError = validateField('checkoutThreshold', checkoutThreshold);
    if (checkoutThresholdError) newErrors.checkoutThreshold = checkoutThresholdError;
    
    const blockDaysError = validateField('blockDays', blockDays);
    if (blockDaysError) newErrors.blockDays = blockDaysError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        system_enabled: systemEnabled,
        grace_period_minutes: gracePeriod,
        checkin_infraction_threshold: checkinThreshold,
        checkout_infraction_threshold: checkoutThreshold,
        temporary_block_days: blockDays,
        send_checkin_reminders: sendReminders
      });
    } catch (err) {
      // Error already handled in hook
    } finally {
      setIsSaving(false);
    }
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
          <CardTitle>Sistema de Check-in/Check-out</CardTitle>
          <CardDescription>
            Configura el comportamiento global del sistema de check-in y check-out de plazas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Enable/Disable */}
          <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="system-enabled" className="text-base font-medium">
                Activar sistema de check-in
              </Label>
              <p className="text-sm text-muted-foreground">
                Habilita o deshabilita el sistema completo de check-in/check-out
              </p>
            </div>
            <Switch
              id="system-enabled"
              checked={systemEnabled}
              onCheckedChange={setSystemEnabled}
            />
          </div>

          {/* Grace Period */}
          <div className="space-y-2">
            <Label htmlFor="grace-period">
              Periodo de gracia (minutos)
            </Label>
            <p className="text-sm text-muted-foreground">
              Tiempo adicional después de la ventana de check-in antes de registrar infracción (0-120 minutos)
            </p>
            <Input
              id="grace-period"
              type="number"
              min={0}
              max={120}
              value={gracePeriod}
              onChange={(e) => handleGracePeriodChange(e.target.value)}
              className={errors.gracePeriod ? 'border-destructive' : ''}
            />
            {errors.gracePeriod && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.gracePeriod}
              </p>
            )}
          </div>

          {/* Infraction Thresholds */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkin-threshold">
                Umbral de infracciones de check-in
              </Label>
              <p className="text-sm text-muted-foreground">
                Número de infracciones de check-in para generar amonestación (1-20)
              </p>
              <Input
                id="checkin-threshold"
                type="number"
                min={1}
                max={20}
                value={checkinThreshold}
                onChange={(e) => handleCheckinThresholdChange(e.target.value)}
                className={errors.checkinThreshold ? 'border-destructive' : ''}
              />
              {errors.checkinThreshold && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.checkinThreshold}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout-threshold">
                Umbral de infracciones de check-out
              </Label>
              <p className="text-sm text-muted-foreground">
                Número de infracciones de check-out para generar amonestación (1-20)
              </p>
              <Input
                id="checkout-threshold"
                type="number"
                min={1}
                max={20}
                value={checkoutThreshold}
                onChange={(e) => handleCheckoutThresholdChange(e.target.value)}
                className={errors.checkoutThreshold ? 'border-destructive' : ''}
              />
              {errors.checkoutThreshold && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.checkoutThreshold}
                </p>
              )}
            </div>
          </div>

          {/* Block Duration */}
          <div className="space-y-2">
            <Label htmlFor="block-days">
              Duración del bloqueo temporal (días)
            </Label>
            <p className="text-sm text-muted-foreground">
              Días que un usuario permanece bloqueado tras recibir una amonestación automática (1-90 días)
            </p>
            <Input
              id="block-days"
              type="number"
              min={1}
              max={90}
              value={blockDays}
              onChange={(e) => handleBlockDaysChange(e.target.value)}
              className={errors.blockDays ? 'border-destructive' : ''}
            />
            {errors.blockDays && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.blockDays}
              </p>
            )}
          </div>

          {/* Reminders */}
          <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="send-reminders" className="text-base font-medium">
                Enviar recordatorios de check-in
              </Label>
              <p className="text-sm text-muted-foreground">
                Notifica a los usuarios cuando deben realizar check-in
              </p>
            </div>
            <Switch
              id="send-reminders"
              checked={sendReminders}
              onCheckedChange={setSendReminders}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Los cambios se aplicarán inmediatamente. Las configuraciones por grupo pueden sobrescribir estos valores globales.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || hasErrors}
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
