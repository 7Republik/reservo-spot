# Supabase MCP Oficial - Guía de Uso

## ✅ Configuración Completada

**MCP Oficial de Supabase instalado y configurado:**
- URL: `https://mcp.supabase.com/mcp`
- Proyecto: `rlrzcfnhhvrvrxzfifeh` (Reserveo)
- Modo: **Read-Write** (con autorización OAuth)
- Features: account, database, debugging, development, docs, functions

## 🎉 Estado Actual

**✅ AUTENTICADO Y FUNCIONANDO**
- 29 herramientas disponibles
- OAuth 2.1 configurado correctamente
- Proyecto: Reserveo (`rlrzcfnhhvrvrxzfifeh`)
- Región: EU North 1 (Estocolmo)
- PostgreSQL: 17.6.1.043

**Verificado:**
- ✅ `list_projects` - Funciona
- ✅ `execute_sql` - Funciona (consultas a information_schema)
- ✅ Consulta de funciones del sistema - 16 funciones de waitlist detectadas

## 🚀 Capacidades Principales

### 1. Ejecutar Cualquier SQL

```typescript
// SELECT
execute_sql({
  query: "SELECT * FROM waitlist_entries WHERE status = 'active'"
})

// INSERT
execute_sql({
  query: `
    INSERT INTO waitlist_entries (user_id, group_id, reservation_date)
    VALUES ('uuid', 'uuid', '2025-11-16')
    RETURNING *
  `
})

// UPDATE
execute_sql({
  query: `
    UPDATE waitlist_entries 
    SET status = 'completed' 
    WHERE id = 'uuid'
  `
})

// DELETE
execute_sql({
  query: "DELETE FROM waitlist_entries WHERE id = 'uuid'"
})

// Funciones
execute_sql({
  query: "SELECT process_waitlist_for_spot('spot-uuid', '2025-11-16')"
})

// CTEs y queries complejas
execute_sql({
  query: `
    WITH active_entries AS (
      SELECT * FROM waitlist_entries WHERE status = 'active'
    )
    SELECT COUNT(*) FROM active_entries
  `
})
```

### 2. Consultar Tablas del Sistema

```typescript
// Ver funciones
execute_sql({
  query: `
    SELECT routine_name, routine_type 
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
  `
})

// Ver triggers
execute_sql({
  query: `
    SELECT trigger_name, event_manipulation, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  `
})

// Ver constraints
execute_sql({
  query: `
    SELECT constraint_name, constraint_type, table_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
  `
})
```

### 3. Aplicar Migraciones

```typescript
// Aplicar migración SQL (se trackea en la BD)
apply_migration({
  name: "add_waitlist_system",
  sql: `
    CREATE TABLE waitlist_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
})
```

### 4. Debugging

```typescript
// Ver logs de PostgreSQL
get_logs({
  service: "postgres",
  limit: 100
})

// Ver logs de API
get_logs({
  service: "api",
  limit: 50
})

// Ver avisos de seguridad
get_advisors()
```

### 5. Documentación

```typescript
// Buscar en docs oficiales
search_docs({
  query: "row level security best practices"
})
```

## 🎯 Ventajas vs MCP Local

| Característica | MCP Local (antiguo) | MCP Oficial (nuevo) |
|----------------|---------------------|---------------------|
| SELECT queries | ✅ Limitado | ✅ Completo |
| INSERT/UPDATE/DELETE | ❌ No | ✅ Sí (con autorización) |
| Tablas del sistema | ❌ No | ✅ Sí |
| Funciones | ❌ No | ✅ Sí |
| Queries complejas | ❌ Limitado | ✅ Completo |
| Aplicar migraciones | ❌ No | ✅ Sí |
| Ver logs | ❌ No | ✅ Sí |
| Buscar docs | ❌ No | ✅ Sí |
| Autorización | ANON_KEY | OAuth 2.1 |

## 🔒 Seguridad

**OAuth 2.1:**
- Usa tus permisos de usuario de Supabase
- No necesitas exponer SERVICE_ROLE_KEY
- Autorización por operación

**Modo configurado:**
- Read-Write habilitado
- Requiere autorización para operaciones de escritura
- Scoped al proyecto específico

## 📝 Primeros Pasos

### 1. ✅ Autenticación Completada

OAuth 2.1 configurado y funcionando. Ya no necesitas volver a autenticarte.

### 2. ✅ Conexión Verificada

```typescript
// ✅ VERIFICADO - Funciona
list_projects()
// Retorna: Reserveo (rlrzcfnhhvrvrxzfifeh) - ACTIVE_HEALTHY

// ✅ VERIFICADO - Funciona
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
})
// Retorna: 24 tablas

// ✅ VERIFICADO - Funciona
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%waitlist%'"
})
// Retorna: 16 funciones de waitlist
```

### 3. Explorar Capacidades

```typescript
// Ver todas las tablas
list_tables({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})

// Ver migraciones aplicadas
list_migrations({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})

// Ver extensiones instaladas
list_extensions({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})

// Buscar en documentación
search_docs({ 
  query: "row level security" 
})

// Ver logs de PostgreSQL
get_logs({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  service: "postgres"
})

// Generar tipos TypeScript
generate_typescript_types({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

## ⚠️ Notas Importantes

1. **MCP Local deshabilitado:** El MCP local anterior (`supabase-reserveo`) está deshabilitado pero conservado como backup.

2. **Autorización requerida:** Operaciones de escritura (INSERT/UPDATE/DELETE) requieren tu autorización explícita.

3. **Respeta RLS:** Las queries respetan las políticas de Row Level Security configuradas.

4. **Logs disponibles:** Puedes ver logs de todos los servicios para debugging.

5. **Docs integradas:** Busca en la documentación oficial sin salir de Kiro.

## 🔄 Migración desde MCP Local

**Cambios en nombres de herramientas:**

| MCP Local (antiguo) | MCP Oficial (nuevo) | Ejemplo |
|---------------------|---------------------|---------|
| `supabase_query` | `execute_sql` | `execute_sql({ project_id, query })` |
| `supabase_list_tables` | `list_tables` | `list_tables({ project_id })` |
| `supabase_list_migrations` | `list_migrations` | `list_migrations({ project_id })` |
| `supabase_describe_table` | `execute_sql` + information_schema | `execute_sql({ query: "SELECT * FROM information_schema.columns WHERE table_name = 'x'" })` |
| `supabase_get_rls_policies` | `execute_sql` + pg_policies | `execute_sql({ query: "SELECT * FROM pg_policies WHERE tablename = 'x'" })` |
| `supabase_count_records` | `execute_sql` + COUNT(*) | `execute_sql({ query: "SELECT COUNT(*) FROM table" })` |

**Nota importante:** Todas las herramientas del MCP oficial requieren `project_id` como parámetro (excepto las de Account como `list_projects`).

**Project ID de Reserveo:** `rlrzcfnhhvrvrxzfifeh`

## 📚 Referencias

- [Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [MCP GitHub](https://github.com/supabase-community/mcp-server-supabase)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 💡 Ejemplos Prácticos para Reserveo

### Verificar Sistema de Lista de Espera

```typescript
// 1. Ver todas las funciones de waitlist
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    SELECT routine_name, routine_type 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%waitlist%'
    ORDER BY routine_name
  `
})

// 2. Ver estructura de tabla waitlist_entries
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'waitlist_entries'
    ORDER BY ordinal_position
  `
})

// 3. Contar entradas activas en lista de espera
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT COUNT(*) as total FROM waitlist_entries WHERE status = 'active'"
})

// 4. Ver ofertas pendientes
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    SELECT wo.*, we.user_id, ps.spot_number
    FROM waitlist_offers wo
    JOIN waitlist_entries we ON wo.waitlist_entry_id = we.id
    JOIN parking_spots ps ON wo.spot_id = ps.id
    WHERE wo.status = 'pending'
  `
})

// 5. Ejecutar función de procesamiento
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT process_waitlist_for_spot('spot-uuid', '2025-11-16')"
})
```

### Debugging de Problemas

```typescript
// Ver logs de PostgreSQL (últimos errores)
get_logs({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  service: "postgres"
})

// Ver logs de API
get_logs({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  service: "api"
})

// Verificar avisos de seguridad
get_advisors({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  type: "security"
})

// Verificar avisos de performance
get_advisors({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  type: "performance"
})
```

### Desarrollo y Mantenimiento

```typescript
// Generar tipos TypeScript actualizados
generate_typescript_types({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
// Guardar resultado en: src/integrations/supabase/types.ts

// Ver todas las migraciones aplicadas
list_migrations({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})

// Ver extensiones PostgreSQL instaladas
list_extensions({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})

// Buscar en documentación oficial
search_docs({
  query: "edge functions cron jobs"
})
```

### Operaciones de Escritura (Requieren Autorización)

```typescript
// Insertar entrada en lista de espera
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    INSERT INTO waitlist_entries (user_id, group_id, reservation_date, status)
    VALUES ('user-uuid', 'group-uuid', '2025-11-20', 'active')
    RETURNING *
  `
})

// Actualizar estado de oferta
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: `
    UPDATE waitlist_offers 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = 'offer-uuid'
    RETURNING *
  `
})

// Aplicar migración nueva
apply_migration({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  name: "add_waitlist_analytics",
  query: `
    CREATE TABLE waitlist_analytics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      metric_name TEXT NOT NULL,
      metric_value NUMERIC,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
})
```

---

**Configurado el:** 2025-11-16  
**Proyecto:** Reserveo (`rlrzcfnhhvrvrxzfifeh`)  
**Estado:** ✅ Activo y funcionando  
**Herramientas:** 29 disponibles  
**Autenticación:** OAuth 2.1 completada
