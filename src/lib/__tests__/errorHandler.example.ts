/**
 * Ejemplos de uso del sistema de manejo de errores robusto
 * 
 * Este archivo muestra cómo usar las funciones de errorHandler.ts
 * para implementar manejo de errores sin exponer detalles técnicos al usuario.
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  safeAsync, 
  safeSupabaseQuery, 
  safeWithCache,
  ensureArray,
  ensureValue,
  isNetworkError 
} from "../errorHandler";
import { offlineCache } from "../offlineCache";

// ============================================================================
// Ejemplo 1: Operación asíncrona simple con safeAsync
// ============================================================================

async function loadDataExample() {
  const result = await safeAsync(
    async () => {
      // Cualquier operación asíncrona que pueda fallar
      const response = await fetch('/api/data');
      return response.json();
    },
    [], // Valor por defecto: array vacío
    {
      showToast: true,
      toastMessage: "Error al cargar datos",
      context: 'loadDataExample'
    }
  );

  if (result.error) {
    // Manejar error sin mostrar detalles técnicos
    console.log('Error manejado:', result.error.message);
    return;
  }

  // Usar data (siempre array, nunca null)
  console.log('Datos cargados:', result.data);
  console.log('¿Está vacío?:', result.isEmpty);
}

// ============================================================================
// Ejemplo 2: Query de Supabase con safeSupabaseQuery
// ============================================================================

async function loadProfileExample(userId: string) {
  const result = await safeSupabaseQuery(
    async () => {
      const query = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return query;
    },
    null, // Valor por defecto: null para single()
    {
      showToast: true,
      toastMessage: "Error al cargar perfil",
      context: 'loadProfile'
    }
  );

  if (result.error) {
    // Error ya registrado y toast mostrado
    return null;
  }

  // Usar data (puede ser null si no existe)
  return result.data;
}

// ============================================================================
// Ejemplo 3: Query con array usando ensureArray
// ============================================================================

async function loadReservationsExample(userId: string) {
  const result = await safeSupabaseQuery(
    async () => {
      const query = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');
      return query;
    },
    [], // Valor por defecto: array vacío
    {
      logError: true,
      context: 'loadReservations'
    }
  );

  // Siempre retornar array, nunca null
  return ensureArray(result.data);
}

// ============================================================================
// Ejemplo 4: Fetch con fallback a cache usando safeWithCache
// ============================================================================

async function loadWithCacheExample(userId: string) {
  const cacheKey = `user_data_${userId}`;

  const result = await safeWithCache(
    // Función de fetch
    async () => {
      const query = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      return query;
    },
    // Función de cache
    async () => {
      return await offlineCache.get(cacheKey);
    },
    null, // Valor por defecto
    {
      showToast: false, // No mostrar toast, el sistema ya avisa con "Mostrando datos en caché"
      context: 'loadWithCache'
    }
  );

  if (result.error) {
    return null;
  }

  // Si viene del cache, el sistema ya mostró toast de advertencia
  return result.data;
}

// ============================================================================
// Ejemplo 5: Manejo de múltiples queries con ensureArray
// ============================================================================

async function loadMultipleDataExample(userId: string) {
  // Query 1: Grupos
  const groupsResult = await safeSupabaseQuery(
    async () => {
      const query = await supabase
        .from('user_group_assignments')
        .select('group_id')
        .eq('user_id', userId);
      return query;
    },
    [],
    { logError: true, context: 'loadGroups' }
  );

  // Query 2: Matrículas
  const platesResult = await safeSupabaseQuery(
    async () => {
      const query = await supabase
        .from('license_plates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_approved', true);
      return query;
    },
    [],
    { logError: true, context: 'loadPlates' }
  );

  // Siempre retornar arrays, nunca null
  const groups = ensureArray(groupsResult.data);
  const plates = ensureArray(platesResult.data);

  return { groups, plates };
}

// ============================================================================
// Ejemplo 6: Detectar errores de red
// ============================================================================

async function handleNetworkErrorExample() {
  const result = await safeAsync(
    async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Network error');
      return response.json();
    },
    [],
    { logError: true, context: 'networkExample' }
  );

  if (result.error) {
    if (isNetworkError(result.error)) {
      console.log('Error de red detectado, intentando cache...');
      // Intentar cargar desde cache
    } else {
      console.log('Otro tipo de error:', result.error.message);
    }
  }
}

// ============================================================================
// Ejemplo 7: Asegurar valores con ensureValue
// ============================================================================

function processDataExample(data: any) {
  // Asegurar que nunca sea null/undefined
  const name = ensureValue(data?.name, 'Sin nombre');
  const age = ensureValue(data?.age, 0);
  const tags = ensureArray(data?.tags);

  console.log('Nombre:', name); // Nunca null
  console.log('Edad:', age); // Nunca null
  console.log('Tags:', tags); // Siempre array
}

// ============================================================================
// Ejemplo 8: Hook completo con manejo de errores robusto
// ============================================================================

import { useState, useEffect } from 'react';

function useDataWithErrorHandling(userId: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const result = await safeSupabaseQuery(
      async () => {
        const query = await supabase
          .from('table')
          .select('*')
          .eq('user_id', userId);
        return query;
      },
      [],
      {
        showToast: true,
        toastMessage: "Error al cargar datos",
        context: 'useDataWithErrorHandling'
      }
    );

    if (result.error) {
      setError(result.error);
      // Siempre retornar array vacío, nunca null
      setData([]);
    } else {
      // Asegurar que siempre sea array
      setData(ensureArray(result.data));
    }

    setLoading(false);
  };

  return { data, loading, error, refetch: loadData };
}

// ============================================================================
// Ejemplo 9: Manejo de errores en operaciones de escritura
// ============================================================================

async function updateDataExample(userId: string, newData: any) {
  const result = await safeSupabaseQuery(
    async () => {
      const query = await supabase
        .from('profiles')
        .update(newData)
        .eq('id', userId);
      return query;
    },
    null,
    {
      showToast: true,
      toastMessage: "Error al actualizar datos",
      context: 'updateData'
    }
  );

  if (result.error) {
    // Error ya manejado y mostrado al usuario
    throw result.error;
  }

  // Operación exitosa
  return true;
}

// ============================================================================
// Ejemplo 10: Patrón completo con offline mode
// ============================================================================

async function loadDataWithOfflineSupport(
  userId: string,
  isOnline: boolean
) {
  const cacheKey = `data_${userId}`;

  // Si offline, cargar solo desde cache
  if (!isOnline) {
    const cached = await offlineCache.get(cacheKey);
    return ensureArray(cached);
  }

  // Si online, intentar fetch con fallback a cache
  const result = await safeWithCache(
    async () => {
      const query = await supabase
        .from('table')
        .select('*')
        .eq('user_id', userId);
      return query;
    },
    async () => {
      return await offlineCache.get(cacheKey);
    },
    [],
    { context: 'loadDataWithOffline' }
  );

  if (result.error) {
    // Fallback ya manejado por safeWithCache
    return [];
  }

  // Cachear datos exitosos
  const data = ensureArray(result.data);
  await offlineCache.set(cacheKey, data);

  return data;
}

export {
  loadDataExample,
  loadProfileExample,
  loadReservationsExample,
  loadWithCacheExample,
  loadMultipleDataExample,
  handleNetworkErrorExample,
  processDataExample,
  useDataWithErrorHandling,
  updateDataExample,
  loadDataWithOfflineSupport,
};
