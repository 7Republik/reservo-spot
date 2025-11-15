# Admin Hooks - Guía de Desarrollo

## 📋 Tabla de Contenidos
1. [Introducción](#introducción)
2. [Patrón de Caché](#patrón-de-caché)
3. [Cuándo Usar forceReload](#cuándo-usar-forcereload)
4. [Anatomía de un Hook Admin](#anatomía-de-un-hook-admin)
5. [Ejemplos de Implementación](#ejemplos-de-implementación)
6. [Crear un Nuevo Hook Admin](#crear-un-nuevo-hook-admin)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Los hooks del admin panel siguen un patrón arquitectónico consistente que:
- **Separa la lógica de negocio de la UI**
- **Implementa caché automático** para reducir llamadas a DB
- **Proporciona invalidación explícita de caché** con `forceReload`
- **Reduce consumo de créditos** en Lovable (menos recargas innecesarias)

### Hooks Disponibles

| Hook | Propósito | Archivo |
|------|-----------|---------|
| `useParkingGroups` | CRUD de grupos de parking | `useParkingGroups.ts` |
| `useLicensePlates` | Aprobación de matrículas | `useLicensePlates.ts` |
| `useUserManagement` | Gestión completa de usuarios | `useUserManagement.ts` |
| `useReservationSettings` | Configuración global de reservas | `useReservationSettings.ts` |
| `useBlockedDates` | Días bloqueados | `useBlockedDates.ts` |
| `useParkingSpots` | Gestión de plazas individuales | `useParkingSpots.ts` |
| `useVisualEditor` | Editor visual de mapas | `useVisualEditor.ts` |
| `useCheckinSettings` | Configuración global de check-in | `useCheckinSettings.ts` |
| `useGroupCheckinConfig` | Configuración de check-in por grupo | `useGroupCheckinConfig.ts` |
| `useCheckinReports` | Reporting de infracciones y estadísticas | `useCheckinReports.ts` |
| `useIncidentManagement` | Gestión de reportes de incidentes | `useIncidentManagement.ts` |
| `useAdminWaitlist` | Gestión administrativa de lista de espera | `useAdminWaitlist.ts` |

---

## 🔄 Patrón de Caché

### Concepto

El patrón de caché evita recargar datos de Supabase cuando el usuario navega entre tabs del admin panel. Usa `useRef` para persistir un flag de caché entre re-renders.

### Implementación Base

```typescript
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMyAdminHook = () => {
  const [data, setData] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 🔑 CLAVE: useRef persiste entre renders sin causar re-renders
  const isCached = useRef(false);

  const loadData = async (forceReload = false) => {
    // ✅ Si está en caché Y no se fuerza recarga, salir inmediatamente
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from("my_table")
        .select("*");

      if (error) throw error;
      
      setData(result || []);
      isCached.current = true; // ✅ Marcar como cacheado
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, loadData };
};
```

### ¿Por qué useRef?

| Alternativa | Problema |
|-------------|----------|
| `useState(false)` | Causa re-render innecesario al actualizar |
| Variable de módulo global | Se comparte entre todas las instancias del hook |
| `useMemo` | No es para valores mutables |
| **`useRef` ✅** | **Mutable, sin re-renders, aislado por instancia** |

---

## 📌 Cuándo Usar forceReload

### Regla General

**Usa `forceReload=true` después de CUALQUIER mutación (CREATE, UPDATE, DELETE)** para sincronizar el estado local con la base de datos.

### Matriz de Decisión

| Escenario | forceReload | Razón |
|-----------|-------------|-------|
| Primera carga (useEffect) | ❌ `false` | Aprovechar caché si ya existe |
| Usuario cambia de tab y vuelve | ❌ `false` | Mostrar datos cacheados |
| Después de CREATE | ✅ `true` | Incluir nuevo registro |
| Después de UPDATE | ✅ `true` | Reflejar cambios |
| Después de DELETE | ✅ `true` | Eliminar registro |
| Después de operación fallida | ❌ `false` | No necesario, datos no cambiaron |
| Usuario presiona "Refrescar" | ✅ `true` | Acción explícita del usuario |

### Ejemplos Prácticos

#### ❌ INCORRECTO: No invalidar caché después de mutación

```typescript
const createGroup = async (name: string) => {
  const { error } = await supabase
    .from("parking_groups")
    .insert({ name });

  if (error) throw error;
  
  toast.success("Grupo creado");
  // ❌ PROBLEMA: UI no muestra el nuevo grupo
  await loadParkingGroups(); // forceReload=false por defecto
};
```

#### ✅ CORRECTO: Invalidar caché después de mutación

```typescript
const createGroup = async (name: string) => {
  const { error } = await supabase
    .from("parking_groups")
    .insert({ name });

  if (error) throw error;
  
  toast.success("Grupo creado");
  // ✅ CORRECTO: Invalida caché y recarga datos frescos
  await loadParkingGroups(true);
};
```

---

## 🏗️ Anatomía de un Hook Admin

### Estructura Estándar

```typescript
/**
 * JSDoc completo explicando el propósito del hook
 * 
 * @returns {Object} State and operations
 * @returns {Type[]} data - Description
 * @returns {boolean} loading - Loading state
 * @returns {Function} loadData - Loads data with caching
 * @returns {Function} createItem - Creates new item
 * // ... más funciones
 * 
 * @example
 * ```tsx
 * const { data, loading, createItem } = useMyHook();
 * useEffect(() => { loadData(); }, []);
 * ```
 */
export const useMyAdminHook = () => {
  // 1️⃣ STATE
  const [data, setData] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  // 2️⃣ LOAD FUNCTION (con caché)
  const loadData = async (forceReload = false) => {
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      // ... fetch logic
      isCached.current = true;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar");
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ MUTATION FUNCTIONS
  const createItem = async (itemData: CreateItemData) => {
    try {
      // ... create logic
      toast.success("Item creado");
      await loadData(true); // ✅ Invalidar caché
      return true;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear");
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<MyType>) => {
    try {
      // ... update logic
      toast.success("Item actualizado");
      await loadData(true); // ✅ Invalidar caché
      return true;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al actualizar");
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // ... delete logic
      toast.success("Item eliminado");
      await loadData(true); // ✅ Invalidar caché
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar");
    }
  };

  // 4️⃣ RETURN (objeto con estado y funciones)
  return {
    data,
    loading,
    loadData,
    createItem,
    updateItem,
    deleteItem,
  };
};
```

---

## 💡 Ejemplos de Implementación

### Ejemplo 1: Hook Básico con CRUD

```typescript
// src/hooks/admin/useCategories.ts
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

/**
 * Custom hook for managing product categories
 * 
 * @returns Categories data and CRUD operations
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  /**
   * Loads all categories with caching
   * @param forceReload - Bypass cache and fetch fresh data
   */
  const loadCategories = async (forceReload = false) => {
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      
      setCategories(data || []);
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates a new category
   * @param name - Category name
   * @param description - Optional description
   * @returns Success status
   */
  const createCategory = async (name: string, description: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
        });

      if (error) throw error;
      
      toast.success("Categoría creada");
      await loadCategories(true); // ✅ Invalidar caché
      return true;
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast.error("Error al crear categoría");
      return false;
    }
  };

  /**
   * Updates an existing category
   * @param id - Category UUID
   * @param updates - Fields to update
   * @returns Success status
   */
  const updateCategory = async (
    id: string, 
    updates: Partial<Category>
  ) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Categoría actualizada");
      await loadCategories(true); // ✅ Invalidar caché
      return true;
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar categoría");
      return false;
    }
  };

  /**
   * Deletes a category
   * @param id - Category UUID
   */
  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Categoría eliminada");
      await loadCategories(true); // ✅ Invalidar caché
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar categoría");
    }
  };

  return {
    categories,
    loading,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
```

### Ejemplo 2: Uso en Componente

```tsx
// src/components/admin/categories/CategoriesTab.tsx
import { useEffect } from "react";
import { useCategories } from "@/hooks/admin/useCategories";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CategoriesTab = () => {
  const {
    categories,
    loading,
    loadCategories,
    createCategory,
    deleteCategory
  } = useCategories();

  // ✅ Primera carga: usa caché si existe
  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async () => {
    const success = await createCategory(
      "Nueva Categoría",
      "Descripción"
    );
    
    if (success) {
      // No necesitas hacer nada más, loadCategories(true)
      // ya fue llamado dentro de createCategory
    }
  };

  const handleRefresh = () => {
    // ✅ Acción explícita del usuario: invalidar caché
    loadCategories(true);
  };

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2>Categorías</h2>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            Refrescar
          </Button>
          <Button onClick={handleCreate}>
            Crear Categoría
          </Button>
        </div>
      </div>

      {categories.map(category => (
        <div key={category.id} className="p-4 border rounded">
          <h3>{category.name}</h3>
          <p>{category.description}</p>
          <Button 
            onClick={() => deleteCategory(category.id)}
            variant="destructive"
          >
            Eliminar
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CategoriesTab;
```

---

## 🆕 Crear un Nuevo Hook Admin

### Paso 1: Crear el Archivo

```bash
# Crear archivo en src/hooks/admin/
touch src/hooks/admin/useMyFeature.ts
```

### Paso 2: Plantilla Base

Copia y adapta esta plantilla:

```typescript
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MyFeatureType } from "@/types/admin";

/**
 * Custom hook for managing [FEATURE_NAME]
 * 
 * [DESCRIBE WHAT THE HOOK DOES]
 * 
 * **Caching**: Implements automatic caching to prevent unnecessary reloads.
 * Use `forceReload=true` to invalidate cache after mutations.
 * 
 * @returns {Object} [FEATURE_NAME] state and operations
 * @returns {MyFeatureType[]} items - [DESCRIPTION]
 * @returns {boolean} loading - Loading state indicator
 * @returns {Function} loadItems - Loads items from DB (with cache)
 * @returns {Function} createItem - Creates new item
 * @returns {Function} updateItem - Updates existing item
 * @returns {Function} deleteItem - Deletes an item
 * 
 * @example
 * ```tsx
 * const {
 *   items,
 *   loading,
 *   createItem
 * } = useMyFeature();
 * 
 * useEffect(() => {
 *   loadItems();
 * }, []);
 * 
 * const handleCreate = async () => {
 *   await createItem({ name: "Test" });
 * };
 * ```
 */
export const useMyFeature = () => {
  const [items, setItems] = useState<MyFeatureType[]>([]);
  const [loading, setLoading] = useState(false);
  const isCached = useRef(false);

  const loadItems = async (forceReload = false) => {
    if (isCached.current && !forceReload) {
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("my_table")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setItems(data || []);
      isCached.current = true;
    } catch (error: any) {
      console.error("Error loading items:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: Partial<MyFeatureType>) => {
    try {
      const { error } = await supabase
        .from("my_table")
        .insert(itemData);

      if (error) throw error;
      
      toast.success("Item creado correctamente");
      await loadItems(true); // ✅ Invalidar caché
      return true;
    } catch (error: any) {
      console.error("Error creating item:", error);
      toast.error("Error al crear item");
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<MyFeatureType>) => {
    try {
      const { error } = await supabase
        .from("my_table")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Item actualizado correctamente");
      await loadItems(true); // ✅ Invalidar caché
      return true;
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast.error("Error al actualizar item");
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("my_table")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Item eliminado correctamente");
      await loadItems(true); // ✅ Invalidar caché
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error("Error al eliminar item");
    }
  };

  return {
    items,
    loading,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
  };
};
```

### Paso 3: Crear Tipos (si es necesario)

```typescript
// src/types/admin/my-feature.types.ts
export interface MyFeatureType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Exportar desde index
// src/types/admin/index.ts
export * from './my-feature.types';
```

### Paso 4: Usar en Componente

```tsx
// src/components/admin/my-feature/MyFeatureTab.tsx
import { useEffect } from "react";
import { useMyFeature } from "@/hooks/admin/useMyFeature";

const MyFeatureTab = () => {
  const { items, loading, loadItems } = useMyFeature();

  useEffect(() => {
    loadItems();
  }, []);

  // ... resto del componente
};
```

---

## ✅ Mejores Prácticas

### 1. Siempre Invalidar Caché Después de Mutaciones

```typescript
// ✅ CORRECTO
const createItem = async (data) => {
  await supabase.from("table").insert(data);
  await loadItems(true); // Invalidar caché
};

// ❌ INCORRECTO
const createItem = async (data) => {
  await supabase.from("table").insert(data);
  await loadItems(); // NO invalida caché
};
```

### 2. Usar Toasts para Feedback

```typescript
// ✅ CORRECTO: Toast de éxito
toast.success("Operación completada");

// ✅ CORRECTO: Toast de error con contexto
toast.error("Error al crear el registro");

// ❌ INCORRECTO: Sin feedback al usuario
// (usuario no sabe si la operación tuvo éxito)
```

### 3. Manejar Errores Correctamente

```typescript
try {
  const { error } = await supabase.from("table").insert(data);
  
  if (error) throw error; // ✅ Throw para catch
  
  toast.success("Éxito");
  await loadItems(true);
  return true;
} catch (error: any) {
  console.error("Error:", error); // ✅ Log para debugging
  toast.error("Error al crear"); // ✅ Feedback al usuario
  return false; // ✅ Indicar fallo
}
```

### 4. Documentar con JSDoc

```typescript
/**
 * Creates a new parking spot
 * 
 * @param {string} spotNumber - Spot identifier (e.g., "A-101")
 * @param {string} groupId - Parent parking group UUID
 * @param {boolean} isAccessible - Has disability access
 * @returns {Promise<boolean>} Success status
 * 
 * @example
 * await createSpot("A-101", "group-uuid", true);
 */
const createSpot = async (
  spotNumber: string,
  groupId: string,
  isAccessible: boolean
) => {
  // ...
};
```

### 5. Retornar Booleanos en Operaciones Críticas

```typescript
// ✅ CORRECTO: Permite al componente reaccionar
const createItem = async (data) => {
  try {
    // ...
    return true; // Éxito
  } catch {
    return false; // Fallo
  }
};

// Uso en componente:
const success = await createItem(data);
if (success) {
  closeDialog();
}
```

---

## 🐛 Troubleshooting

### Problema: Datos No Se Actualizan en UI

**Causa**: No se está invalidando el caché después de mutaciones.

**Solución**:
```typescript
// ✅ Agregar forceReload=true
await loadData(true);
```

### Problema: Hook Recarga Datos Cada Vez

**Causa**: `isCached.current` no se está marcando como `true` después de cargar.

**Solución**:
```typescript
const loadData = async (forceReload = false) => {
  // ...
  setData(result);
  isCached.current = true; // ✅ NO OLVIDAR
};
```

### Problema: Caché Compartido Entre Instancias

**Causa**: Usar variable de módulo en lugar de `useRef`.

**Solución**:
```typescript
// ❌ INCORRECTO: Variable de módulo (compartida)
let isCached = false;

// ✅ CORRECTO: useRef (aislado por instancia)
const isCached = useRef(false);
```

### Problema: Loading State No Se Muestra

**Causa**: Caché devuelve inmediatamente sin activar loading.

**Solución**: Esto es intencional. Si quieres mostrar loading en primera carga:

```typescript
const [initialLoad, setInitialLoad] = useState(true);

const loadData = async (forceReload = false) => {
  if (isCached.current && !forceReload) {
    return;
  }

  try {
    setLoading(true);
    // ... fetch
    isCached.current = true;
    setInitialLoad(false);
  } finally {
    setLoading(false);
  }
};

// En componente:
if (loading || initialLoad) {
  return <Skeleton />;
}
```

---

## 📚 Recursos Adicionales

- **Guía Técnica Completa**: `.lovable/technical-guide.md` (debe agregarse en Project Settings → Manage Knowledge)
- **Custom Knowledge Base**: `.lovable/custom-knowledge.md` (debe agregarse en Project Settings → Manage Knowledge)
- **Tipos Admin**: `src/types/admin/`
- **Componentes Admin**: `src/components/admin/`

---

**Última actualización**: 2025-01-10  
**Versión**: 1.0.0  
**Autor**: Equipo RESERVEO


---

## 📊 Ejemplo: Hook de Reporting (useCheckinReports)

### Características Especiales

El hook `useCheckinReports` es único porque:
- **No usa caché automático** (datos de reporting deben ser siempre frescos)
- **Soporta múltiples tipos de datos** (infracciones, histórico, estadísticas)
- **Incluye exportación a CSV** con formato localizado
- **Filtros avanzados** por grupo, usuario, fecha, tipo

### Implementación

```typescript
// src/hooks/admin/useCheckinReports.ts
export const useCheckinReports = () => {
  const [todayInfractions, setTodayInfractions] = useState<CheckinReportItem[]>([]);
  const [checkinHistory, setCheckinHistory] = useState<CheckinHistoryItem[]>([]);
  const [stats, setStats] = useState<CheckinStats | null>(null);
  const [loading, setLoading] = useState(false);

  // ⚠️ NOTA: No usa isCached porque los reportes deben ser siempre frescos

  const loadTodayInfractions = async (filters?: CheckinReportsFilters) => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('checkin_infractions')
        .select(`
          *,
          profiles:user_id(full_name),
          parking_spots:spot_id(spot_number),
          parking_groups:group_id(name)
        `)
        .eq('infraction_date', today);

      // Aplicar filtros dinámicos
      if (filters?.groupId) query = query.eq('group_id', filters.groupId);
      if (filters?.userId) query = query.eq('user_id', filters.userId);
      if (filters?.infractionType) query = query.eq('infraction_type', filters.infractionType);

      const { data, error } = await query.order('detected_at', { ascending: false });
      if (error) throw error;

      // Transformar datos con joins
      const formattedData = (data || []).map(item => ({
        user_id: item.user_id,
        user_name: item.profiles?.full_name || 'Usuario desconocido',
        spot_number: item.parking_spots?.spot_number || 'N/A',
        group_name: item.parking_groups?.name || 'N/A',
        reservation_date: item.infraction_date,
        infraction_type: item.infraction_type,
        detected_at: item.detected_at,
        expected_window_end: item.expected_checkin_window_end,
        grace_period_end: item.grace_period_end
      }));

      setTodayInfractions(formattedData);
    } catch (err) {
      console.error('Error loading infractions:', err);
      toast.error('Error al cargar infracciones');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: CheckinReportItem[] | CheckinHistoryItem[], filename: string) => {
    // Detectar tipo de datos
    const isInfractionReport = 'infraction_type' in data[0];

    let csv: string;
    if (isInfractionReport) {
      // CSV para infracciones
      csv = [
        ['Usuario', 'Plaza', 'Grupo', 'Fecha', 'Tipo', 'Detectado'],
        ...data.map(r => [
          r.user_name,
          r.spot_number,
          r.group_name,
          r.reservation_date,
          r.infraction_type === 'checkin' ? 'Check-in' : 'Check-out',
          new Date(r.detected_at).toLocaleString('es-ES')
        ])
      ].map(row => row.join(',')).join('\n');
    } else {
      // CSV para histórico
      csv = [
        ['Usuario', 'Plaza', 'Grupo', 'Check-in', 'Check-out', 'Duración (min)'],
        ...data.map(h => [
          h.user_name,
          h.spot_number,
          h.group_name,
          h.checkin_at ? new Date(h.checkin_at).toLocaleString('es-ES') : 'N/A',
          h.checkout_at ? new Date(h.checkout_at).toLocaleString('es-ES') : 'N/A',
          h.duration_minutes?.toString() || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');
    }

    // Descargar archivo con BOM para Excel
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Archivo CSV descargado');
  };

  return {
    todayInfractions,
    checkinHistory,
    stats,
    loading,
    loadTodayInfractions,
    loadCheckinHistory,
    calculateStats,
    exportToCSV
  };
};
```

### Uso en Componente

```tsx
// src/components/admin/reports/CheckinReportPanel.tsx
import { useEffect, useState } from "react";
import { useCheckinReports } from "@/hooks/admin/useCheckinReports";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const CheckinReportPanel = () => {
  const {
    todayInfractions,
    loading,
    loadTodayInfractions,
    exportToCSV
  } = useCheckinReports();

  const [filters, setFilters] = useState({
    groupId: undefined,
    infractionType: undefined
  });

  // ✅ Cargar datos al montar y cuando cambien filtros
  useEffect(() => {
    loadTodayInfractions(filters);
  }, [filters]);

  // ✅ Auto-refresh cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      loadTodayInfractions(filters);
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [filters]);

  const handleExport = () => {
    exportToCSV(todayInfractions, 'infracciones-hoy');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Infracciones del Día</h2>
        <div className="flex gap-2">
          <Select
            value={filters.infractionType}
            onValueChange={(value) => 
              setFilters(prev => ({ ...prev, infractionType: value }))
            }
          >
            <option value="">Todos los tipos</option>
            <option value="checkin">Check-in</option>
            <option value="checkout">Check-out</option>
          </Select>
          
          <Button 
            onClick={handleExport}
            disabled={todayInfractions.length === 0}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Plaza</th>
              <th>Grupo</th>
              <th>Tipo</th>
              <th>Detectado</th>
            </tr>
          </thead>
          <tbody>
            {todayInfractions.map((infraction, idx) => (
              <tr key={idx}>
                <td>{infraction.user_name}</td>
                <td>{infraction.spot_number}</td>
                <td>{infraction.group_name}</td>
                <td>
                  {infraction.infraction_type === 'checkin' 
                    ? 'Check-in' 
                    : 'Check-out'}
                </td>
                <td>
                  {new Date(infraction.detected_at).toLocaleString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && todayInfractions.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No hay infracciones registradas hoy
        </div>
      )}
    </div>
  );
};

export default CheckinReportPanel;
```

### Características Clave

1. **Sin Caché**: Los datos de reporting siempre se cargan frescos
2. **Filtros Dinámicos**: Soporta múltiples filtros combinables
3. **Auto-refresh**: Actualización automática cada minuto
4. **Exportación CSV**: Con formato localizado y BOM para Excel
5. **Joins Complejos**: Combina datos de múltiples tablas
6. **Transformación de Datos**: Formatea datos para UI
7. **Cálculo de Estadísticas**: Métricas de cumplimiento en tiempo real

### Diferencias con Otros Hooks

| Característica | Hooks CRUD | useCheckinReports |
|----------------|------------|-------------------|
| Caché | ✅ Sí | ❌ No (datos frescos) |
| forceReload | ✅ Necesario | ❌ No aplica |
| Auto-refresh | ❌ No | ✅ Sí (cada minuto) |
| Filtros | ❌ Básicos | ✅ Avanzados |
| Exportación | ❌ No | ✅ CSV con BOM |
| Joins | ❌ Simples | ✅ Complejos |
| Estadísticas | ❌ No | ✅ Sí |

