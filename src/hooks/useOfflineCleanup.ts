import { useEffect } from 'react';
import { getOfflineStorage } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para gestionar la limpieza automática del cache offline
 * 
 * Responsabilidades:
 * - Limpia datos expirados al iniciar la aplicación
 * - Aplica límites de almacenamiento (FIFO)
 * - Limpia todo el cache al cerrar sesión
 * 
 * @example
 * ```tsx
 * // En App.tsx
 * useOfflineCleanup();
 * ```
 */
export const useOfflineCleanup = () => {
  useEffect(() => {
    const storage = getOfflineStorage();

    // Limpieza al iniciar la aplicación
    const cleanupOnStartup = async () => {
      try {
        await storage.cleanupOnStartup();
      } catch (error) {
        console.error('[useOfflineCleanup] Error en limpieza inicial:', error);
      }
    };

    // Ejecutar limpieza inicial
    cleanupOnStartup();

    // Escuchar eventos de cierre de sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        console.log('[useOfflineCleanup] Usuario cerró sesión, limpiando cache...');
        try {
          await storage.cleanupOnLogout();
        } catch (error) {
          console.error('[useOfflineCleanup] Error al limpiar cache en logout:', error);
        }
      }
    });

    // Cleanup: desuscribirse del listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
};
