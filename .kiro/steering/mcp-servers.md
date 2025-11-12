---
inclusion: always
---

# RESERVEO - MCP Servers Available

## Siempre háblame en español

## Overview

Este proyecto tiene configurados varios MCP (Model Context Protocol) servers que proporcionan herramientas especializadas para diferentes tareas.

## 1. Supabase MCP Server

**Servidor:** `mcp_supabase_reserveo`  
**Propósito:** Interacción directa con la base de datos de Supabase  
**Proyecto:** `rlrzcfnhhvrvrxzfifeh` (Reserveo)

### Herramientas Disponibles

#### `supabase_query`
Ejecuta queries SELECT en la base de datos (solo lectura por seguridad).

```typescript
mcp_supabase_reserveo_supabase_query({
  query: "SELECT * FROM profiles WHERE is_blocked = false LIMIT 10"
})
```

**Uso recomendado:**
- Inspeccionar datos antes de hacer cambios
- Verificar estado de registros
- Debugging de problemas
- Análisis de datos

**Limitaciones:**
- Solo SELECT (no INSERT/UPDATE/DELETE)
- Respeta las políticas RLS del usuario autenticado

#### `supabase_list_tables`
Lista todas las tablas en el schema público.

```typescript
mcp_supabase_reserveo_supabase_list_tables()
```

**Retorna:**
- Nombres de todas las tablas
- Útil para explorar la estructura de la BD

#### `supabase_describe_table`
Obtiene información detallada de una tabla específica.

```typescript
mcp_supabase_reserveo_supabase_describe_table({
  tableName: "reservations"
})
```

**Retorna:**
- Columnas y sus tipos
- Constraints (PK, FK, UNIQUE, CHECK)
- Índices
- Valores por defecto

**Uso recomendado:**
- Antes de crear migraciones
- Verificar estructura de tabla
- Entender relaciones entre tablas

#### `supabase_list_migrations`
Lista todos los archivos de migración en `supabase/migrations/`.

```typescript
mcp_supabase_reserveo_supabase_list_migrations()
```

**Retorna:**
- Nombres de archivos de migración
- Ordenados cronológicamente

#### `supabase_read_migration`
Lee el contenido de un archivo de migración específico.

```typescript
mcp_supabase_reserveo_supabase_read_migration({
  filename: "20251111234017_add_incident_reporting_features.sql"
})
```

**Uso recomendado:**
- Revisar migraciones anteriores
- Entender cambios de schema
- Copiar patrones de migraciones exitosas

#### `supabase_get_project_info`
Obtiene información del proyecto de Supabase.

```typescript
mcp_supabase_reserveo_supabase_get_project_info()
```

**Retorna:**
- Project ID
- URL del proyecto
- Región
- Estado

#### `supabase_cli_status`
Verifica el estado del CLI de Supabase y servicios locales.

```typescript
mcp_supabase_reserveo_supabase_cli_status()
```

**Nota:** Este proyecto NO usa Docker local, trabaja directamente con la BD remota.

#### `supabase_cli_command`
Ejecuta comandos del CLI de Supabase.

```typescript
mcp_supabase_reserveo_supabase_cli_command({
  command: "migration list"
})
```

**Comandos útiles:**
- `migration list` - Ver migraciones aplicadas
- `gen types typescript --linked` - Regenerar tipos
- `db push` - Aplicar migraciones pendientes

**⚠️ Usar con precaución:** Algunos comandos modifican la BD.

#### `supabase_count_records`
Cuenta registros en una tabla con filtros opcionales.

```typescript
mcp_supabase_reserveo_supabase_count_records({
  tableName: "reservations",
  filters: { status: "active" }
})
```

**Uso recomendado:**
- Verificar cantidad de registros
- Estadísticas rápidas
- Validar resultados de operaciones

#### `supabase_get_rls_policies`
Obtiene las políticas de Row Level Security de una tabla.

```typescript
mcp_supabase_reserveo_supabase_get_rls_policies({
  tableName: "incident_reports"
})
```

**Retorna:**
- Nombre de la política
- Comando (SELECT, INSERT, UPDATE, DELETE)
- Rol (authenticated, anon)
- Expresión USING
- Expresión WITH CHECK

**Uso recomendado:**
- Verificar seguridad de tablas
- Debugging de problemas de permisos
- Antes de crear nuevas políticas

## 2. Fetch MCP Server

**Servidor:** `mcp_fetch`  
**Propósito:** Obtener contenido de URLs de internet

### Herramientas Disponibles

#### `fetch`
Obtiene contenido de una URL y lo convierte a markdown.

```typescript
mcp_fetch_fetch({
  url: "https://example.com/api/docs",
  max_length: 5000,
  start_index: 0,
  raw: false
})
```

**Parámetros:**
- `url` (requerido) - URL a obtener
- `max_length` (opcional) - Máximo de caracteres (default: 5000)
- `start_index` (opcional) - Índice de inicio (default: 0)
- `raw` (opcional) - Obtener HTML sin simplificar (default: false)

**Uso recomendado:**
- Consultar documentación externa
- Obtener información actualizada
- Verificar APIs públicas

## 3. Memory MCP Server

**Servidor:** `mcp_memory`  
**Propósito:** Gestión de knowledge graph para recordar información entre sesiones

### Herramientas Disponibles

#### `create_entities`
Crea nuevas entidades en el knowledge graph.

```typescript
mcp_memory_create_entities({
  entities: [
    {
      name: "Usuario Juan",
      entityType: "user",
      observations: [
        "Tiene 3 advertencias por ocupar plazas",
        "Matrícula: 1234ABC"
      ]
    }
  ]
})
```

**Uso recomendado:**
- Recordar información importante del proyecto
- Guardar decisiones de diseño
- Documentar problemas recurrentes

#### `create_relations`
Crea relaciones entre entidades.

```typescript
mcp_memory_create_relations({
  relations: [
    {
      from: "Usuario Juan",
      to: "Plaza A-15",
      relationType: "ocupa_frecuentemente"
    }
  ]
})
```

#### `add_observations`
Añade observaciones a entidades existentes.

```typescript
mcp_memory_add_observations({
  observations: [
    {
      entityName: "Usuario Juan",
      contents: ["Recibió advertencia el 2025-11-12"]
    }
  ]
})
```

#### `delete_entities`
Elimina entidades del knowledge graph.

```typescript
mcp_memory_delete_entities({
  entityNames: ["Usuario Juan"]
})
```

#### `delete_observations`
Elimina observaciones específicas.

```typescript
mcp_memory_delete_observations({
  deletions: [
    {
      entityName: "Usuario Juan",
      observations: ["Observación obsoleta"]
    }
  ]
})
```

#### `delete_relations`
Elimina relaciones entre entidades.

```typescript
mcp_memory_delete_relations({
  relations: [
    {
      from: "Usuario Juan",
      to: "Plaza A-15",
      relationType: "ocupa_frecuentemente"
    }
  ]
})
```

#### `read_graph`
Lee todo el knowledge graph.

```typescript
mcp_memory_read_graph()
```

**Retorna:** Todas las entidades, relaciones y observaciones.

#### `search_nodes`
Busca nodos en el knowledge graph.

```typescript
mcp_memory_search_nodes({
  query: "advertencias"
})
```

**Uso recomendado:**
- Buscar información guardada previamente
- Recuperar contexto de conversaciones anteriores

#### `open_nodes`
Abre nodos específicos por nombre.

```typescript
mcp_memory_open_nodes({
  names: ["Usuario Juan", "Plaza A-15"]
})
```

## 4. Brave Search MCP Server

**Servidor:** `mcp_brave_search`  
**Propósito:** Búsquedas en internet (web y locales)

### Herramientas Disponibles

#### `brave_web_search`
Búsqueda web general usando Brave Search API.

```typescript
mcp_brave_search_brave_web_search({
  query: "Supabase Row Level Security best practices",
  count: 10,
  offset: 0
})
```

**Parámetros:**
- `query` (requerido) - Búsqueda (max 400 chars)
- `count` (opcional) - Número de resultados (1-20, default: 10)
- `offset` (opcional) - Paginación (max 9, default: 0)

**Uso recomendado:**
- Buscar documentación actualizada
- Resolver errores específicos
- Investigar mejores prácticas

#### `brave_local_search`
Búsqueda de negocios y lugares locales.

```typescript
mcp_brave_search_brave_local_search({
  query: "parking management software near Madrid",
  count: 5
})
```

**Retorna:**
- Nombres de negocios
- Direcciones
- Ratings y reviews
- Teléfonos y horarios

**Uso recomendado:**
- Buscar servicios locales
- Investigar competencia
- Encontrar proveedores

## 5. Vercel MCP Server

**Servidor:** `mcp_vercel`  
**Propósito:** Gestión de deployments y proyectos en Vercel

### Herramientas Disponibles

#### `search_vercel_documentation`
Busca en la documentación de Vercel.

```typescript
mcp_vercel_search_vercel_documentation({
  topic: "environment variables",
  tokens: 2500
})
```

**Temas útiles:**
- `environment variables`
- `deployments`
- `edge functions`
- `caching`
- `routing`

#### `deploy_to_vercel`
Despliega el proyecto actual a Vercel.

```typescript
mcp_vercel_deploy_to_vercel()
```

**⚠️ Usar con precaución:** Crea un deployment en producción.

#### `list_projects`
Lista todos los proyectos de Vercel (max 50).

```typescript
mcp_vercel_list_projects({
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})
```

**Retorna:**
- Project IDs
- Nombres de proyectos
- URLs

#### `get_project`
Obtiene información de un proyecto específico.

```typescript
mcp_vercel_get_project({
  projectId: "prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})
```

**Retorna:**
- Configuración del proyecto
- Variables de entorno
- Dominios
- Framework detectado

#### `list_deployments`
Lista deployments de un proyecto.

```typescript
mcp_vercel_list_deployments({
  projectId: "prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj",
  since: 1699999999000,
  until: 1700000000000
})
```

**Retorna:**
- URLs de deployments
- Estados (READY, ERROR, BUILDING)
- Timestamps
- Commits asociados

#### `get_deployment`
Obtiene información de un deployment específico.

```typescript
mcp_vercel_get_deployment({
  idOrUrl: "dpl_xxx",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})
```

#### `get_deployment_build_logs`
Obtiene logs de build de un deployment.

```typescript
mcp_vercel_get_deployment_build_logs({
  idOrUrl: "dpl_xxx",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj",
  limit: 100
})
```

**Uso recomendado:**
- Debugging de builds fallidos
- Verificar errores de deployment
- Analizar tiempos de build

#### `get_access_to_vercel_url`
Genera URL temporal para acceder a deployments protegidos.

```typescript
mcp_vercel_get_access_to_vercel_url({
  url: "https://myapp-abc123.vercel.app"
})
```

**Uso recomendado:**
- Acceder a previews protegidos
- Compartir acceso temporal

#### `web_fetch_vercel_url`
Obtiene contenido de una URL de Vercel con autenticación.

```typescript
mcp_vercel_web_fetch_vercel_url({
  url: "https://myapp.vercel.app/api/status"
})
```

**Uso recomendado:**
- Verificar deployments protegidos
- Testear APIs en preview

#### `list_teams`
Lista los equipos del usuario.

```typescript
mcp_vercel_list_teams()
```

**Retorna:**
- Team IDs
- Nombres de equipos
- Slugs

#### `check_domain_availability_and_price`
Verifica disponibilidad de dominios.

```typescript
mcp_vercel_check_domain_availability_and_price({
  names: ["reserveo.com", "reserveo.app"]
})
```

**Retorna:**
- Disponibilidad
- Precios
- Información de registro

## Configuración Actual del Proyecto

### IDs Importantes

```bash
# Supabase
Project ID: rlrzcfnhhvrvrxzfifeh
Project URL: https://rlrzcfnhhvrvrxzfifeh.supabase.co

# Vercel
Project ID: prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1
Team ID: team_TPhaQhZC6XMlLHwfJtQjojBj
Project Name: reservo-spot
```

### Ubicación de Configuración

**MCP Config:** `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "supabase": { ... },
    "fetch": { ... },
    "memory": { ... },
    "brave-search": { ... },
    "vercel": { ... }
  }
}
```

## Mejores Prácticas

### Cuándo Usar Cada MCP

**Supabase MCP:**
- ✅ Inspeccionar datos antes de cambios
- ✅ Verificar políticas RLS
- ✅ Contar registros
- ✅ Leer migraciones
- ❌ NO para modificar datos (usar código)

**Fetch MCP:**
- ✅ Consultar documentación externa
- ✅ Verificar APIs públicas
- ❌ NO para datos sensibles

**Memory MCP:**
- ✅ Recordar decisiones importantes
- ✅ Guardar contexto entre sesiones
- ✅ Documentar problemas recurrentes
- ❌ NO para datos temporales

**Brave Search MCP:**
- ✅ Buscar soluciones a errores
- ✅ Investigar mejores prácticas
- ✅ Documentación actualizada
- ❌ NO para información del proyecto

**Vercel MCP:**
- ✅ Verificar deployments
- ✅ Debugging de builds
- ✅ Gestionar dominios
- ⚠️ Cuidado con deployments automáticos

## Ejemplos de Uso Común

### Verificar Estado de la BD

```typescript
// 1. Listar tablas
mcp_supabase_reserveo_supabase_list_tables()

// 2. Ver estructura de tabla
mcp_supabase_reserveo_supabase_describe_table({
  tableName: "incident_reports"
})

// 3. Contar registros
mcp_supabase_reserveo_supabase_count_records({
  tableName: "incident_reports",
  filters: { status: "pending" }
})

// 4. Verificar RLS
mcp_supabase_reserveo_supabase_get_rls_policies({
  tableName: "incident_reports"
})
```

### Debugging de Deployment

```typescript
// 1. Listar deployments recientes
mcp_vercel_list_deployments({
  projectId: "prj_TcQ3rzoqL0xchwZYNp7IUAnxZ1L1",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj"
})

// 2. Ver logs del último deployment
mcp_vercel_get_deployment_build_logs({
  idOrUrl: "dpl_xxx",
  teamId: "team_TPhaQhZC6XMlLHwfJtQjojBj",
  limit: 100
})
```

### Investigar Error

```typescript
// 1. Buscar en web
mcp_brave_search_brave_web_search({
  query: "Supabase RLS policy not working authenticated users",
  count: 5
})

// 2. Consultar documentación
mcp_vercel_search_vercel_documentation({
  topic: "authentication"
})

// 3. Obtener contenido específico
mcp_fetch_fetch({
  url: "https://supabase.com/docs/guides/auth/row-level-security"
})
```

## Limitaciones y Consideraciones

1. **Rate Limits:** Algunos MCPs tienen límites de uso
2. **Autenticación:** Requieren configuración previa
3. **Permisos:** Respetan permisos del usuario
4. **Costo:** Algunos servicios pueden tener costo (Brave Search)
5. **Disponibilidad:** Dependen de servicios externos

## Referencias

- [MCP Protocol](https://modelcontextprotocol.io/)
- [Supabase MCP](https://github.com/supabase-community/mcp-server-supabase)
- [Vercel MCP](https://github.com/vercel/mcp-server-vercel)
