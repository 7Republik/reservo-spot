/**
 * Ejemplo de uso del hook useWaitlistSettings
 * 
 * Este archivo muestra cómo usar el hook para gestionar
 * la configuración del sistema de lista de espera.
 */

import { useEffect } from 'react';
import { useWaitlistSettings } from './useWaitlistSettings';

export const WaitlistSettingsExample = () => {
  const {
    settings,
    loading,
    loadSettings,
    saveSettings,
    updateSettings,
    isOnline,
    canModify
  } = useWaitlistSettings();

  // Cargar configuración al montar el componente
  useEffect(() => {
    loadSettings();
  }, []);

  // Ejemplo 1: Habilitar lista de espera
  const handleEnableWaitlist = async () => {
    const success = await saveSettings({
      waitlist_enabled: true
    });
    
    if (success) {
      console.log('Lista de espera habilitada');
    }
  };

  // Ejemplo 2: Configurar tiempo de aceptación
  const handleSetAcceptanceTime = async (minutes: number) => {
    // Validar rango (30-1440 minutos)
    if (minutes < 30 || minutes > 1440) {
      console.error('Tiempo debe estar entre 30 y 1440 minutos');
      return;
    }

    const success = await saveSettings({
      waitlist_acceptance_time_minutes: minutes
    });
    
    if (success) {
      console.log(`Tiempo de aceptación configurado a ${minutes} minutos`);
    }
  };

  // Ejemplo 3: Configurar límite de listas simultáneas
  const handleSetMaxSimultaneous = async (max: number) => {
    // Validar rango (1-10)
    if (max < 1 || max > 10) {
      console.error('Máximo debe estar entre 1 y 10');
      return;
    }

    const success = await saveSettings({
      waitlist_max_simultaneous: max
    });
    
    if (success) {
      console.log(`Máximo de listas simultáneas: ${max}`);
    }
  };

  // Ejemplo 4: Habilitar prioridad por roles
  const handleEnablePriorityByRole = async () => {
    const success = await saveSettings({
      waitlist_priority_by_role: true
    });
    
    if (success) {
      console.log('Prioridad por roles habilitada');
    }
  };

  // Ejemplo 5: Configurar sistema de penalización
  const handleConfigurePenalty = async () => {
    const success = await saveSettings({
      waitlist_penalty_enabled: true,
      waitlist_penalty_threshold: 3, // 3 no respuestas
      waitlist_penalty_duration_days: 7 // 7 días de bloqueo
    });
    
    if (success) {
      console.log('Sistema de penalización configurado');
    }
  };

  // Ejemplo 6: Actualizar estado local sin guardar
  const handleLocalUpdate = () => {
    updateSettings({
      waitlist_enabled: true,
      waitlist_acceptance_time_minutes: 180
    });
    
    console.log('Estado local actualizado (no guardado en BD)');
  };

  // Ejemplo 7: Guardar configuración completa
  const handleSaveCompleteConfig = async () => {
    const success = await saveSettings({
      waitlist_enabled: true,
      waitlist_acceptance_time_minutes: 120, // 2 horas
      waitlist_max_simultaneous: 5,
      waitlist_priority_by_role: true,
      waitlist_penalty_enabled: true,
      waitlist_penalty_threshold: 3,
      waitlist_penalty_duration_days: 7
    });
    
    if (success) {
      console.log('Configuración completa guardada');
    }
  };

  // Ejemplo 8: Recargar configuración (invalidar cache)
  const handleReload = async () => {
    await loadSettings(true); // forceReload = true
    console.log('Configuración recargada desde BD');
  };

  // Ejemplo 9: Verificar si se puede modificar
  const handleCheckCanModify = () => {
    if (!isOnline) {
      console.log('Sin conexión - solo lectura');
      return;
    }

    if (!canModify) {
      console.log('No tienes permisos para modificar');
      return;
    }

    console.log('Puedes modificar la configuración');
  };

  // Ejemplo 10: Mostrar configuración actual
  const handleShowCurrentConfig = () => {
    console.log('Configuración actual:', {
      enabled: settings.waitlist_enabled,
      acceptanceTime: `${settings.waitlist_acceptance_time_minutes} minutos`,
      maxSimultaneous: settings.waitlist_max_simultaneous,
      priorityByRole: settings.waitlist_priority_by_role,
      penaltyEnabled: settings.waitlist_penalty_enabled,
      penaltyThreshold: settings.waitlist_penalty_threshold,
      penaltyDuration: `${settings.waitlist_penalty_duration_days} días`
    });
  };

  return {
    loading,
    settings,
    isOnline,
    canModify,
    // Funciones de ejemplo
    handleEnableWaitlist,
    handleSetAcceptanceTime,
    handleSetMaxSimultaneous,
    handleEnablePriorityByRole,
    handleConfigurePenalty,
    handleLocalUpdate,
    handleSaveCompleteConfig,
    handleReload,
    handleCheckCanModify,
    handleShowCurrentConfig
  };
};

/**
 * Ejemplo de uso en un componente de configuración de admin
 */
export const AdminWaitlistConfigExample = () => {
  const {
    settings,
    loading,
    loadSettings,
    saveSettings,
    canModify
  } = useWaitlistSettings();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (formData: any) => {
    if (!canModify) {
      console.error('No puedes modificar sin conexión');
      return;
    }

    const success = await saveSettings({
      waitlist_enabled: formData.enabled,
      waitlist_acceptance_time_minutes: formData.acceptanceTime,
      waitlist_max_simultaneous: formData.maxSimultaneous,
      waitlist_priority_by_role: formData.priorityByRole,
      waitlist_penalty_enabled: formData.penaltyEnabled,
      waitlist_penalty_threshold: formData.penaltyThreshold,
      waitlist_penalty_duration_days: formData.penaltyDuration
    });

    if (success) {
      // Recargar para obtener valores actualizados
      await loadSettings(true);
    }
  };

  if (loading) {
    return { loading: true };
  }

  return {
    settings,
    canModify,
    handleSubmit
  };
};
