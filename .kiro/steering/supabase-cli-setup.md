---
inclusion: always
---

# Supabase CLI - Setup Completo

## Estado Actual ✅

**CLI Instalado**: Supabase CLI v2.58.5 (vía Homebrew)  
**Autenticación**: ✅ Completada (`supabase login`)  
**Proyecto Vinculado**: ✅ `rlrzcfnhhvrvrxzfifeh` (Reserveo)  
**Migraciones**: ✅ 20 migraciones ya aplicadas en remoto por el usuario

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

## Comandos Disponibles para IA

### Gestión de Migraciones

```bash
# Crear nueva migración
supabase migration new <nombre_descriptivo>

# Listar migraciones (local vs remoto)
supabase migration list

# Aplicar migraciones pendientes a remoto
supabase db push

# Ver diferencias entre local y remoto (requiere Docker)
supabase db diff --linked
```

### Generación de Tipos TypeScript

```bash
# Generar tipos desde base de datos remota
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# IMPORTANTE: Ejecutar después de cada cambio de schema
```

### Consultas SQL Directas

```bash
# Conectar a base de datos remota con psql
supabase db remote psql

# Ejecutar query directa
supabase db remote psql -c "SELECT * FROM profiles LIMIT 5"
```

### Información del Proyecto

```bash
# Listar todos los proyectos
supabase projects list

# Ver estado del proyecto vinculado
supabase projects api-keys
```

## Workflow para Nuevas Migraciones

**Cuando necesites crear cambios en la base de datos:**

1. **Crear archivo de migración**:
   ```bash
   supabase migration new add_nueva_funcionalidad
   ```

2. **Editar el archivo SQL generado** en `supabase/migrations/`

3. **Aplicar a producción**:
   ```bash
   supabase db push
   ```

4. **Regenerar tipos TypeScript**:
   ```bash
   supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

5. **Commit de cambios**:
   ```bash
   git add supabase/migrations/*.sql src/integrations/supabase/types.ts
   git commit -m "feat: add nueva funcionalidad"
   ```

## Limitaciones Actuales

- **Docker no requerido**: No usamos desarrollo local con Docker
- **Solo operaciones remotas**: Trabajamos directamente con la base de datos en la nube
- **MCP como alternativa**: Para consultas de lectura, usar herramientas MCP de Supabase

## Comandos que NO Requieren Docker

✅ `supabase login`  
✅ `supabase projects list`  
✅ `supabase link`  
✅ `supabase migration new`  
✅ `supabase migration list`  
✅ `supabase db push`  
✅ `supabase gen types typescript --linked`  
✅ `supabase db remote psql`  

❌ `supabase start` (requiere Docker)  
❌ `supabase db reset` (requiere Docker)  
❌ `supabase db diff` (requiere Docker)  
❌ `supabase status` (requiere Docker)  

## Verificación Rápida

```bash
# Verificar que todo está OK
supabase projects list | grep rlrzcfnhhvrvrxzfifeh
supabase migration list
```

## Notas Importantes

1. **Las migraciones ya están aplicadas** - El usuario las aplicó manualmente
2. **No hacer `supabase db push`** sin verificar primero con `migration list`
3. **Usar MCP tools** para consultas de lectura (más rápido y seguro)
4. **Regenerar tipos** después de cada cambio de schema
5. **No requiere Docker** para operaciones básicas de migración
