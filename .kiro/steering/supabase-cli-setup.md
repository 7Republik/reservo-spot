---
inclusion: always
---

# Supabase CLI - Setup Completo

## Estado Actual ✅ Siempre hablame en español.

**CLI Instalado**: Supabase CLI v2.58.5 (vía Homebrew)  
**Autenticación**: ✅ Completada (`supabase login`)  
**Proyecto Vinculado**: ✅ `rlrzcfnhhvrvrxzfifeh` (Reserveo) - Marcado con ●  
**Migraciones**: ✅ 54 migraciones sincronizadas (Local = Remote)  
**Última verificación**: 2025-11-16

**⚠️ IMPORTANTE:** Este proyecto **NO usa Docker local**. Trabajamos directamente con la base de datos remota.

## Configuración Verificada

```bash
# Ubicación del CLI
/opt/homebrew/bin/supabase

# Versión
supabase --version  # 2.58.5

# Proyecto vinculado
supabase projects list  # Muestra ✔ en Reserveo

# Archivos de configuración
supabase/config.toml         # project_id = "rlrzcfnhhvrvrxzfifeh"
supabase/.gitignore          # Creado
supabase/migrations/         # 20 archivos SQL
```

## Comandos Disponibles y Verificados

### ✅ Gestión de Migraciones (FUNCIONAN)

```bash
# Crear nueva migración
supabase migration new <nombre_descriptivo>
# Crea archivo: supabase/migrations/<timestamp>_<nombre>.sql

# Listar migraciones (local vs remoto)
supabase migration list
# ✅ VERIFICADO - Muestra 54 migraciones sincronizadas

# Aplicar migraciones pendientes a remoto
supabase db push
# Aplica migraciones locales que no están en remoto

# Pull schema desde remoto
supabase db pull
# Descarga schema remoto como nueva migración
```

### ✅ Generación de Tipos TypeScript (FUNCIONA)

```bash
# Generar tipos desde base de datos remota
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# IMPORTANTE: Ejecutar después de cada cambio de schema
# ⚠️ Alternativa con MCP: generate_typescript_types({ project_id })
```

### ❌ Consultas SQL Directas (NO FUNCIONA COMO ESPERADO)

```bash
# ❌ INCORRECTO - No acepta -c ni --command
supabase db remote psql -c "SELECT * FROM profiles"

# ✅ CORRECTO - Solo abre sesión interactiva
supabase db remote psql
# Luego escribir queries manualmente

# ⚠️ MEJOR ALTERNATIVA: Usar MCP execute_sql
# execute_sql({ project_id, query: "SELECT * FROM profiles" })
```

### ✅ Información del Proyecto (FUNCIONA)

```bash
# Listar todos los proyectos
supabase projects list
# ✅ VERIFICADO - Muestra Reserveo con ● (linked)

# Ver API keys del proyecto
supabase projects api-keys
```

### ❌ Comandos que Requieren Docker (NO DISPONIBLES)

```bash
# ❌ NO FUNCIONA - Requiere Docker
supabase start
supabase stop
supabase status
supabase db reset
supabase db diff

# Este proyecto NO usa desarrollo local con Docker
```

## Workflow para Nuevas Migraciones

**Cuando necesites crear cambios en la base de datos:**

1. **Crear archivo de migración**:
   ```bash
   supabase migration new add_nueva_funcionalidad
   ```
   Crea: `supabase/migrations/<timestamp>_add_nueva_funcionalidad.sql`

2. **Editar el archivo SQL generado** en `supabase/migrations/`
   - Escribir DDL (CREATE TABLE, ALTER TABLE, etc.)
   - Incluir RLS policies
   - Incluir funciones y triggers

3. **Verificar sintaxis** (opcional):
   ```bash
   supabase db lint
   ```

4. **Aplicar a producción**:
   ```bash
   supabase db push
   ```
   ⚠️ Esto aplica TODAS las migraciones pendientes

5. **Regenerar tipos TypeScript**:
   ```bash
   supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```
   O usar MCP: `generate_typescript_types({ project_id })`

6. **Commit de cambios**:
   ```bash
   git add supabase/migrations/*.sql src/integrations/supabase/types.ts
   git commit -m "feat: add nueva funcionalidad"
   ```

### ⚠️ Alternativa con MCP (Recomendado)

Para queries ad-hoc que no necesitan tracking:
```typescript
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "CREATE TABLE test (...)"
})
```

Para migraciones que deben trackearse:
```typescript
apply_migration({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  name: "add_nueva_funcionalidad",
  query: "CREATE TABLE ..."
})
```

## Limitaciones Actuales

- **Docker no requerido**: No usamos desarrollo local con Docker
- **Solo operaciones remotas**: Trabajamos directamente con la base de datos en la nube
- **MCP como alternativa**: Para consultas de lectura, usar herramientas MCP de Supabase

## Comandos Disponibles (Sin Docker)

### ✅ Funcionan Correctamente

| Comando | Descripción | Verificado |
|---------|-------------|------------|
| `supabase login` | Autenticación | ✅ |
| `supabase projects list` | Lista proyectos | ✅ 2025-11-16 |
| `supabase link` | Vincular proyecto | ✅ |
| `supabase migration new` | Crear migración | ✅ |
| `supabase migration list` | Listar migraciones | ✅ 2025-11-16 (54 migraciones) |
| `supabase db push` | Aplicar migraciones | ✅ |
| `supabase db pull` | Descargar schema | ✅ |
| `supabase db lint` | Verificar errores | ✅ |
| `supabase gen types typescript --linked` | Generar tipos | ✅ |
| `supabase db remote psql` | Sesión psql interactiva | ✅ (solo interactivo) |
| `supabase projects api-keys` | Ver API keys | ✅ |

### ❌ Requieren Docker (No Disponibles)

| Comando | Razón |
|---------|-------|
| `supabase start` | Inicia servicios locales (Docker) |
| `supabase stop` | Detiene servicios locales (Docker) |
| `supabase status` | Estado de servicios locales (Docker) |
| `supabase db reset` | Resetea BD local (Docker) |
| `supabase db diff` | Compara schemas (Docker) |

**Este proyecto NO usa desarrollo local con Docker.**  

## Verificación Rápida

```bash
# ✅ Verificar proyecto vinculado
supabase projects list
# Buscar ● junto a Reserveo

# ✅ Verificar migraciones sincronizadas
supabase migration list
# Local debe coincidir con Remote

# ✅ Verificar versión del CLI
supabase --version
# Actual: 2.58.5
```

## Comparativa: CLI vs MCP

| Operación | CLI | MCP Oficial | Recomendación |
|-----------|-----|-------------|---------------|
| Crear migración | `supabase migration new` | N/A | ✅ CLI |
| Aplicar migración trackeada | `supabase db push` | `apply_migration` | ✅ CLI (más simple) |
| Ejecutar SQL ad-hoc | ❌ No directo | `execute_sql` | ✅ MCP |
| Ver estructura de tablas | ❌ No directo | `execute_sql` + information_schema | ✅ MCP |
| Generar tipos TS | `supabase gen types` | `generate_typescript_types` | ✅ Ambos funcionan |
| Ver logs | ❌ No disponible | `get_logs` | ✅ MCP |
| Listar proyectos | `supabase projects list` | `list_projects` | ✅ Ambos funcionan |
| Debugging | ❌ Limitado | `get_advisors`, `get_logs` | ✅ MCP |

## Notas Importantes

1. **54 migraciones sincronizadas** - Local = Remote ✅
2. **Usar `migration list`** antes de `db push` para verificar
3. **MCP es mejor para queries** - Más rápido y flexible
4. **CLI es mejor para migraciones** - Workflow estándar
5. **No requiere Docker** - Trabajamos directo con remoto
6. **Proyecto vinculado correctamente** - Marcado con ● en `projects list`

## Cuándo Usar Cada Uno

**Usar CLI cuando:**
- ✅ Crear nuevas migraciones (`migration new`)
- ✅ Aplicar migraciones trackeadas (`db push`)
- ✅ Descargar schema remoto (`db pull`)
- ✅ Generar tipos TypeScript (`gen types`)

**Usar MCP cuando:**
- ✅ Ejecutar queries SQL (SELECT, INSERT, UPDATE, DELETE)
- ✅ Consultar estructura de BD (information_schema)
- ✅ Ver logs y debugging
- ✅ Ejecutar funciones
- ✅ Queries complejas (CTEs, subqueries)
- ✅ Verificar datos en tiempo real
