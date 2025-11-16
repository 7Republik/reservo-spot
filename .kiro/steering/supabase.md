---
inclusion: always
---

# Supabase Development Guidelines - RESERVEO 

## Current Project Configuration
Siempre hablame en español.
**Project ID**: `rlrzcfnhhvrvrxzfifeh`  
**Project URL**: `https://rlrzcfnhhvrvrxzfifeh.supabase.co`  
**Database Schema**: 24 tables, 20+ migrations applied  
**PostgreSQL Version**: 17.6.1.043  
**Region**: EU North 1 (Estocolmo)  
**Status**: ACTIVE_HEALTHY  
**Last Updated**: 2025-11-16

## 🎉 MCP Oficial Configurado

**✅ AUTENTICADO Y FUNCIONANDO**
- **29 herramientas disponibles** (vs 9 del MCP local anterior)
- **OAuth 2.1** configurado correctamente
- **Autonomía completa** para ejecutar SQL, ver logs, debugging
- **Ya no necesitas ejecutar SQL manualmente en el Dashboard**

**Herramienta principal:** `execute_sql` - Ejecuta CUALQUIER SQL (SELECT, INSERT, UPDATE, DELETE, funciones, CTEs, etc.)

**Verificado:**
- ✅ Consultas a `information_schema` funcionan
- ✅ Ejecución de funciones funciona
- ✅ 16 funciones de waitlist detectadas
- ✅ 24 tablas en schema público

### Quick Access Links
- **Dashboard**: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh
- **Table Editor**: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/editor
- **SQL Editor**: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/sql/new
- **API Docs**: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/api
- **Auth Users**: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/auth/users
- **Storage**: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/storage/buckets

### Environment Variables (from .env)
```bash
VITE_SUPABASE_PROJECT_ID="rlrzcfnhhvrvrxzfifeh"
VITE_SUPABASE_URL="https://rlrzcfnhhvrvrxzfifeh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## ⚠️ REGLAS CRÍTICAS DE USO DE CLI Y MCP

### Supabase CLI - Comandos Correctos

**`supabase db remote psql`** - Solo abre sesión interactiva de PostgreSQL
- ❌ **NO acepta** flags `-c`, `--command`, `--file`
- ❌ **NO acepta** pipes (`|`) ni redirección (`<`, `>`)
- ✅ **SOLO** abre una sesión interactiva: `supabase db remote psql`
- ✅ Para ejecutar queries, usar **dentro** de la sesión interactiva

**Comandos CLI disponibles:**
```bash
# Ver comandos disponibles
supabase db --help

# Comandos principales:
supabase db pull          # Descargar schema remoto
supabase db push          # Aplicar migraciones pendientes
supabase db diff          # Ver diferencias (requiere Docker)
supabase db reset         # Resetear BD local (requiere Docker)
supabase db dump          # Exportar datos/schema
supabase db lint          # Verificar errores de tipado
```

**Para ejecutar SQL en remoto:**
```bash
# ✅ OPCIÓN 1: Sesión interactiva
supabase db remote psql
# Luego escribir queries manualmente

# ✅ OPCIÓN 2: Usar herramientas MCP (recomendado)
# Ver sección "MCP Tools" más abajo
```

### MCP Supabase Oficial - Capacidades Completas

**Configuración actual:** MCP oficial de Supabase (`https://mcp.supabase.com/mcp`)
- ✅ **Proyecto específico:** `rlrzcfnhhvrvrxzfifeh` (Reserveo)
- ✅ **Modo:** Read-write (con autorización OAuth)
- ✅ **Features habilitadas:** account, database, debugging, development, docs, functions

**`execute_sql`** - Ejecuta cualquier SQL con autorización
- ✅ **SÍ funciona** con SELECT, INSERT, UPDATE, DELETE
- ✅ **SÍ funciona** con tablas del sistema PostgreSQL (`pg_proc`, `information_schema`, etc.)
- ✅ **SÍ funciona** con queries complejas (CTEs, subqueries, joins, etc.)
- ✅ **SÍ funciona** con funciones y procedimientos almacenados
- ✅ **Usa tus permisos** de usuario autenticado (OAuth 2.1)
- ⚠️ **Requiere autorización** para operaciones de escritura

**Uso correcto del MCP oficial:**
```typescript
// ✅ CORRECTO - SELECT simple
execute_sql({
  query: "SELECT * FROM profiles WHERE is_blocked = false LIMIT 10"
})

// ✅ CORRECTO - Joins complejos
execute_sql({
  query: `
    SELECT r.*, p.name, ps.spot_number 
    FROM reservations r 
    JOIN profiles p ON r.user_id = p.id
    JOIN parking_spots ps ON r.spot_id = ps.id
    WHERE r.reservation_date >= CURRENT_DATE
  `
})

// ✅ CORRECTO - Tablas del sistema
execute_sql({
  query: `
    SELECT routine_name, routine_type 
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
  `
})

// ✅ CORRECTO - Funciones
execute_sql({
  query: "SELECT process_waitlist_for_spot('spot-uuid', '2025-11-16')"
})

// ✅ CORRECTO - INSERT (con autorización)
execute_sql({
  query: `
    INSERT INTO waitlist_entries (user_id, group_id, reservation_date)
    VALUES ('user-uuid', 'group-uuid', '2025-11-16')
  `
})

// ✅ CORRECTO - UPDATE (con autorización)
execute_sql({
  query: `
    UPDATE waitlist_entries 
    SET status = 'completed' 
    WHERE id = 'entry-uuid'
  `
})

// ✅ CORRECTO - CTEs y queries complejas
execute_sql({
  query: `
    WITH active_entries AS (
      SELECT * FROM waitlist_entries WHERE status = 'active'
    )
    SELECT COUNT(*) FROM active_entries
  `
})
```

### Tabla de Decisión: ¿Qué Herramienta Usar?

| Necesidad | Herramienta Correcta | Ejemplo |
|-----------|---------------------|---------|
| Ejecutar SELECT | `execute_sql` | `SELECT * FROM profiles` |
| Ejecutar INSERT/UPDATE/DELETE | `execute_sql` | `INSERT INTO table VALUES (...)` |
| Queries complejas (CTEs, subqueries) | `execute_sql` | `WITH cte AS (...) SELECT ...` |
| Ejecutar funciones | `execute_sql` | `SELECT my_function(args)` |
| Ver tablas del sistema | `execute_sql` | `SELECT * FROM information_schema.tables` |
| Listar todas las tablas | `list_tables` | Lista tablas del schema público |
| Listar extensiones | `list_extensions` | Lista extensiones PostgreSQL |
| Ver migraciones | `list_migrations` | Lista migraciones aplicadas |
| Aplicar migración | `apply_migration` | Aplica SQL y lo trackea |
| Buscar en docs | `search_docs` | Busca en documentación oficial |
| Ver logs | `get_logs` | Logs de api, postgres, functions, etc. |
| Ver advisors | `get_advisors` | Avisos de seguridad/performance |
| Generar tipos TS | `generate_typescript_types` | Genera tipos desde schema |
| Ver Edge Functions | `list_edge_functions` | Lista funciones edge |
| Crear migración | CLI: `supabase migration new name` | Desde terminal |
| Push migraciones | CLI: `supabase db push` | Desde terminal |

### Errores Comunes a EVITAR

**❌ NUNCA hacer:**
1. `supabase db remote psql -c "query"` → Flag `-c` no existe
2. `supabase db remote psql --command "query"` → Flag `--command` no existe
3. `cat file.sql | supabase db remote psql` → No acepta pipes
4. `supabase db remote psql < file.sql` → No acepta redirección
5. Pedir al usuario que ejecute SQL manualmente cuando puedo usar `execute_sql`
6. Usar CLI cuando MCP puede hacerlo

**✅ SIEMPRE hacer:**
1. **USAR `execute_sql` PRIMERO** - Para cualquier query SQL (SELECT, INSERT, UPDATE, DELETE)
2. **USAR MCP TOOLS** - Antes de pedir al usuario que ejecute queries manualmente
3. Verificar documentación antes de ejecutar comandos CLI
4. Usar `--help` para ver flags disponibles de CLI
5. Usar `apply_migration` para cambios de schema que deben trackearse
6. Usar `execute_sql` para queries ad-hoc que no necesitan tracking

### 🎯 REGLA DE ORO: Autonomía Total con MCP Oficial

**ANTES de pedir al usuario que ejecute SQL en el Dashboard:**
1. ✅ Usar `execute_sql` para CUALQUIER query (SELECT, INSERT, UPDATE, DELETE)
2. ✅ Usar `list_tables` para ver tablas disponibles
3. ✅ Usar `list_migrations` para ver migraciones
4. ✅ Usar `execute_sql` para consultar tablas del sistema
5. ✅ Usar `execute_sql` para ejecutar funciones

**NUNCA pedir al usuario que ejecute SQL manualmente porque:**
- ✅ Tengo `execute_sql` que puede ejecutar CUALQUIER SQL
- ✅ Tengo autorización OAuth con permisos del usuario
- ✅ Puedo hacer INSERT/UPDATE/DELETE con autorización
- ✅ Puedo consultar tablas del sistema PostgreSQL
- ✅ Puedo ejecutar funciones y procedimientos

**SOLO pedir al usuario ayuda si:**
- ❌ El MCP falla por problemas de conexión
- ❌ Necesito permisos que el usuario no tiene
- ❌ Hay un error de autenticación OAuth

**Ejemplos de autonomía total:**

```typescript
// ✅ CORRECTO - Verifico yo mismo con execute_sql
"Déjame verificar si la tabla existe..."
execute_sql({ query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" })

"Voy a revisar la estructura de la tabla..."
execute_sql({ 
  query: `
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'waitlist_entries'
  ` 
})

"Verificando si hay registros..."
execute_sql({ query: "SELECT COUNT(*) FROM waitlist_entries" })

"Voy a ejecutar la función para procesar la lista de espera..."
execute_sql({ 
  query: "SELECT process_waitlist_for_spot('spot-uuid', '2025-11-16')" 
})

"Insertando un registro de prueba..."
execute_sql({ 
  query: `
    INSERT INTO waitlist_entries (user_id, group_id, reservation_date)
    VALUES ('user-uuid', 'group-uuid', '2025-11-16')
    RETURNING *
  ` 
})

// ❌ INCORRECTO - Pido al usuario sin intentar
"¿Puedes ejecutar esta query en el Dashboard y darme el resultado?"
"SELECT * FROM waitlist_entries"
```

**Ventajas del MCP oficial:**
- 🚀 **Autonomía completa** - No necesito pedir al usuario que ejecute SQL
- 🔒 **Seguro** - Usa OAuth con permisos del usuario
- 💪 **Potente** - Ejecuta cualquier SQL (SELECT, INSERT, UPDATE, DELETE)
- 🎯 **Completo** - Acceso a tablas del sistema y funciones
- ⚡ **Rápido** - Resultados inmediatos sin copiar/pegar

## Database Management

### Migration Workflow
- **NEVER modify database schema directly in production**
- Always create migrations: `supabase migration new <name>`
- Test migrations locally: `supabase db reset`
- Apply to production: `supabase db push`
- Regenerate types after schema changes: `supabase gen types typescript --linked > src/integrations/supabase/types.ts`

### MCP Tools Available (Oficial de Supabase) - 29 Herramientas

**✅ VERIFICADO Y FUNCIONANDO** - Autenticado con OAuth 2.1

#### 🗄️ Database Tools (Las más importantes)

**`execute_sql`** - Ejecuta CUALQUIER SQL
```typescript
// SELECT simple
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT * FROM waitlist_entries WHERE status = 'active'"
})

// Consultar funciones del sistema
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'"
})

// Ejecutar función
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "SELECT process_waitlist_for_spot('spot-uuid', '2025-11-16')"
})

// INSERT con RETURNING
execute_sql({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  query: "INSERT INTO waitlist_entries (user_id, group_id, reservation_date) VALUES (...) RETURNING *"
})
```

**`list_tables`** - Lista tablas del schema público
```typescript
list_tables({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  schemas: ["public"]  // Opcional, default: ["public"]
})
```

**`list_extensions`** - Lista extensiones PostgreSQL
```typescript
list_extensions({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`list_migrations`** - Lista migraciones aplicadas
```typescript
list_migrations({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`apply_migration`** - Aplica migración SQL (trackea en BD)
```typescript
apply_migration({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  name: "add_waitlist_feature",
  query: "CREATE TABLE waitlist_entries (...)"
})
```

#### 📚 Documentation Tools

**`search_docs`** - Busca en docs oficiales de Supabase
```typescript
search_docs({
  query: "row level security best practices",
  limit: 5  // Opcional
})
```

#### 🐛 Debugging Tools

**`get_logs`** - Obtiene logs por servicio
```typescript
// Logs de PostgreSQL
get_logs({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  service: "postgres"  // api, postgres, edge-function, auth, storage, realtime
})
```

**`get_advisors`** - Avisos de seguridad y performance
```typescript
get_advisors({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  type: "security"  // security o performance
})
```

#### 🛠️ Development Tools

**`get_project_url`** - URL de la API del proyecto
```typescript
get_project_url({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`get_anon_key`** - API key anónima (pública)
```typescript
get_anon_key({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`generate_typescript_types`** - Genera tipos TypeScript
```typescript
generate_typescript_types({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
// Retorna código TypeScript completo para guardar en archivo
```

#### ⚡ Edge Functions Tools

**`list_edge_functions`** - Lista Edge Functions
```typescript
list_edge_functions({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`get_edge_function`** - Obtiene código de Edge Function
```typescript
get_edge_function({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  function_slug: "process-waitlist"
})
```

**`deploy_edge_function`** - Despliega Edge Function
```typescript
deploy_edge_function({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  name: "process-waitlist",
  files: [
    { name: "index.ts", content: "..." }
  ],
  entrypoint_path: "index.ts"
})
```

#### 🌿 Branching Tools (Experimental, requiere plan de pago)

**`create_branch`** - Crea branch de desarrollo
```typescript
create_branch({
  project_id: "rlrzcfnhhvrvrxzfifeh",
  name: "develop",
  confirm_cost_id: "xxx"  // Requiere confirmar costo primero
})
```

**`list_branches`** - Lista branches de desarrollo
```typescript
list_branches({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`delete_branch`** - Elimina branch
```typescript
delete_branch({
  branch_id: "branch-uuid"
})
```

**`merge_branch`** - Merge branch a producción
```typescript
merge_branch({
  branch_id: "branch-uuid"
})
```

**`reset_branch`** - Resetea branch a versión anterior
```typescript
reset_branch({
  branch_id: "branch-uuid",
  migration_version: "20251116000000"  // Opcional
})
```

**`rebase_branch`** - Rebase branch con producción
```typescript
rebase_branch({
  branch_id: "branch-uuid"
})
```

#### 👥 Account Tools (Sin project_id)

**`list_projects`** - Lista todos los proyectos
```typescript
list_projects()
// Retorna: [{ id, ref, name, region, status, ... }]
```

**`get_project`** - Detalles de un proyecto
```typescript
get_project({
  id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`create_project`** - Crea nuevo proyecto
```typescript
create_project({
  name: "My New Project",
  region: "eu-north-1",
  organization_id: "org-uuid",
  confirm_cost_id: "xxx"  // Requiere confirmar costo
})
```

**`pause_project`** - Pausa proyecto
```typescript
pause_project({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`restore_project`** - Restaura proyecto pausado
```typescript
restore_project({
  project_id: "rlrzcfnhhvrvrxzfifeh"
})
```

**`list_organizations`** - Lista organizaciones
```typescript
list_organizations()
```

**`get_organization`** - Detalles de organización
```typescript
get_organization({
  id: "org-uuid"
})
```

**`get_cost`** - Obtiene costo de crear proyecto/branch
```typescript
get_cost({
  type: "project",  // project o branch
  organization_id: "org-uuid"
})
```

**`confirm_cost`** - Confirma entendimiento del costo
```typescript
confirm_cost({
  type: "project",
  recurrence: "monthly",
  amount: 25
})
// Retorna confirm_cost_id para usar en create_project/create_branch
```

#### 📦 Storage Tools (Disponibles pero no habilitadas por defecto)

**`list_storage_buckets`** - Lista buckets de storage
**`get_storage_config`** - Configuración de storage
**`update_storage_config`** - Actualiza config (requiere plan de pago)

---

## 🎯 Herramientas Más Usadas

**Top 5 para desarrollo diario:**
1. `execute_sql` - Para TODO lo relacionado con SQL
2. `list_tables` - Ver tablas disponibles
3. `get_logs` - Debugging de problemas
4. `search_docs` - Consultar documentación
5. `generate_typescript_types` - Mantener tipos actualizados

**Para operaciones avanzadas:**
- `apply_migration` - Cambios de schema trackeados
- `deploy_edge_function` - Desplegar funciones serverless
- `get_advisors` - Revisar seguridad y performance

### Key Database Patterns

**24 Active Tables** (verified via MCP):

**Core Tables:**
1. `profiles` - User profiles (extends auth.users)
2. `user_roles` - Role assignments (general, visitor, preferred, director, admin)
3. `parking_groups` - Parking zones/floors (includes is_incident_reserve flag, button_size)
4. `parking_spots` - Individual parking spaces
5. `reservations` - Parking reservations
6. `license_plates` - Vehicle plates (require approval)
7. `user_group_assignments` - User access to parking groups
8. `blocked_dates` - Dates when reservations are blocked
9. `reservation_settings` - Global configuration (singleton, includes waitlist and check-in settings)
10. `reservation_cancellation_log` - Audit trail

**Incident System:**
11. `incident_reports` - Problem reports with photo support (photo_url column)
12. `user_warnings` - Warnings issued to users (includes viewed_at for tracking)

**Check-in System:**
13. `reservation_checkins` - Check-in/check-out records
14. `checkin_infractions` - Infractions for missing check-in/check-out
15. `checkin_settings` - Global check-in configuration (singleton)
16. `parking_group_checkin_config` - Per-group check-in configuration
17. `user_blocks` - Temporary blocks from check-in/waitlist infractions

**Waitlist System:**
18. `waitlist_entries` - Active waitlist registrations
19. `waitlist_offers` - Offers sent to users
20. `waitlist_logs` - Audit log of all waitlist actions
21. `waitlist_penalties` - Penalty tracking for rejections/expirations
22. `notifications` - In-app notifications

**Additional:**
23. `parking_group_locations` - Location and hours info (NOT YET IMPLEMENTED)
24. `checkin_stats` - Aggregated statistics (NOT YET IMPLEMENTED)

**54 Migrations Applied** (from 2025-11-05 to 2025-11-15):
- Initial schema setup
- Parking groups and visual editor (button_size column)
- License plate management
- Reservation validation
- User blocking/deactivation
- Incident reporting with photos (photo_url column)
- User warnings system (viewed_at tracking)
- Incident reserve groups (is_incident_reserve flag)
- Check-in/check-out system (complete)
- Waitlist system (complete)
- Fast reservation threshold
- Check-in statistics functions
- Storage buckets: incident-photos (created manually, RLS policies applied)

**Critical Functions (40+):**

**Core Functions:**
- `is_admin(user_id)` - Check admin role
- `has_role(user_id, role)` - Check specific role
- `get_user_role_priority(user_id)` - Get role priority (1-5)
- `is_user_active(user_id)` - Check if user is not blocked/deactivated
- `validate_parking_spot_reservation()` - Comprehensive reservation validation
- `get_reservable_date_range()` - Calculate valid booking window
- `cancel_all_user_future_reservations()` - Cancel user's future bookings

**Incident Functions:**
- `find_available_spot_for_incident(user_id, date, original_spot_id)` - Find alternative spot for incident reassignment
- `get_user_warning_count(user_id)` - Get total warnings for a user

**Check-in Functions:**
- `perform_checkin(reservation_id, user_id)` - Register check-in with validation
- `perform_checkout(reservation_id, user_id)` - Register check-out
- `detect_checkin_infractions()` - Find reservations without check-in
- `detect_checkout_infractions()` - Find check-ins without check-out
- `generate_automatic_warnings()` - Create warnings from infractions
- `is_user_blocked_by_checkin(user_id)` - Check for active blocks
- `send_checkin_reminders()` - Send reminder notifications
- `get_checkin_stats(group_id, start_date, end_date)` - Statistics for reporting
- `get_checkin_activity_by_hour(group_id, start_date, end_date)` - Hourly activity
- `get_checkin_heatmap(group_id, start_date, end_date)` - Day/hour heatmap
- `get_top_fast_checkin_users(group_id, start_date, end_date, limit)` - Top users

**Waitlist Functions:**
- `register_in_waitlist(user_id, group_id, date)` - Register in waitlist with validations
- `process_waitlist_for_spot(spot_id, date)` - Process waitlist when spot available
- `create_waitlist_offer(entry_id, spot_id)` - Create offer for user
- `accept_waitlist_offer(offer_id, user_id)` - Accept offer and create reservation
- `reject_waitlist_offer(offer_id, user_id)` - Reject offer and process next
- `expire_waitlist_offers()` - Expire pending offers (cron job)
- `cleanup_expired_waitlist_entries()` - Clean old entries (cron job)
- `check_user_waitlist_limit(user_id)` - Validate simultaneous lists limit
- `check_user_penalty_status(user_id)` - Check if user is blocked by penalties
- `calculate_waitlist_position(entry_id)` - Calculate position in queue
- `get_next_in_waitlist(group_id, date)` - Get next user with priority logic

**Automatic Triggers (15+):**
- `on_auth_user_created` - Auto-create profile + assign 'general' role
- `on_user_blocked_or_deactivated` - Cancel reservations when user blocked
- `on_license_plate_removed` - Cancel reservations when plate disapproved
- `on_user_group_assignment_deleted` - Cancel reservations when group access removed
- `on_reservation_cancelled` - Process waitlist when reservation cancelled
- `on_checkin_infraction_created` - Track infractions for automatic warnings
- `on_checkout_infraction_created` - Track checkout infractions
- `updated_at` triggers on multiple tables for timestamp management

**Scheduled Jobs (pg_cron - 10+):**

**Check-in Jobs:**
- `reset_daily_checkins` - Daily at 00:00 - Reset check-in states and detect checkout infractions
- `detect_checkin_infractions` - Every 15 minutes - Find missing check-ins
- `generate_checkin_warnings` - Every hour - Create warnings from infractions
- `expire_user_blocks` - Every hour - Remove expired blocks
- `send_checkin_reminders` - Every 30 minutes - Send reminder notifications

**Waitlist Jobs:**
- `expire_waitlist_offers` - Every 5 minutes - Expire pending offers
- `cleanup_waitlist_entries` - Daily at 00:00 - Remove old/invalid entries
- `send_waitlist_reminders` - Every 15 minutes - Send offer reminders

## Row Level Security (RLS)

**All tables have RLS enabled** - Security is enforced at database level.

**Common Patterns:**
- Users can only view/modify their own data
- Admins have full access via `is_admin(auth.uid())`
- Anonymous users are explicitly denied access
- Use `auth.uid()` to get current authenticated user

**When creating new tables:**
1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Create policies for SELECT, INSERT, UPDATE, DELETE
3. Always include admin bypass: `USING (is_admin(auth.uid()))`
4. Deny anonymous: `CREATE POLICY "Deny anon" ON table_name FOR SELECT TO anon USING (false);`

## Frontend Integration

### Client Usage
```typescript
import { supabase } from '@/integrations/supabase/client'

// Queries respect RLS automatically
const { data, error } = await supabase
  .from('reservations')
  .select('*')
  .eq('user_id', userId)
```

### Type Safety
- **NEVER manually edit** `src/integrations/supabase/types.ts`
- Types are auto-generated from database schema
- Import types: `import { Database } from '@/integrations/supabase/types'`
- Use table types: `Database['public']['Tables']['reservations']['Row']`

### React Query Pattern
Use TanStack Query for data fetching:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['reservations', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data
  }
})
```

## Storage

**IMPORTANT**: Storage buckets CANNOT be created via SQL migrations. They must be created manually via:
- Supabase Dashboard: https://supabase.com/dashboard/project/rlrzcfnhhvrvrxzfifeh/storage/buckets
- Or using Supabase Management API

RLS policies for storage buckets CAN be applied via migrations.

### Bucket: `floor-plans`
- **Type**: Public bucket
- Stores parking map images
- Public read access (anyone with URL can view)
- Admin-only write access
- Referenced in `parking_groups.floor_plan_url`
- **Upload pattern**: Direct File object upload works fine

### Bucket: `incident-photos` ✅
- **Type**: Public bucket (for performance)
- **Status**: Created manually via Dashboard (2025-11-12)
- **File size limit**: 10 MB
- **Allowed MIME types**: image/jpeg, image/png, image/heic, image/heif
- **RLS Policies**: Applied for INSERT/DELETE operations
- **Structure**: `{user_id}/{incident_id}.jpg`
- Users can upload their own photos
- Admins can view/delete all photos
- Users can delete their own photos within 24 hours

### Storage Upload Best Practices

**⚠️ CRITICAL BUG**: Supabase has a known bug where uploading `File` objects directly causes them to be stored with incorrect Content-Type (`application/json` instead of `image/jpeg`).

**✅ SOLUTION**: Always convert File to ArrayBuffer before uploading:

```typescript
// ❌ WRONG - Will result in application/json Content-Type
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(path, file, {
    contentType: file.type
  });

// ✅ CORRECT - Converts to ArrayBuffer first
const arrayBuffer = await file.arrayBuffer();
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(path, arrayBuffer, {
    contentType: file.type || 'image/jpeg'
  });
```

**Why this happens**: When Supabase receives a File object, it incorrectly detects it as JSON. Converting to ArrayBuffer forces Supabase to respect the `contentType` parameter.

**Reference**: https://github.com/orgs/supabase/discussions/34982

### Storage Path vs URL

**IMPORTANT**: Store only the **storage path** in the database, not the full URL.

```typescript
// ✅ CORRECT - Store path only
photo_url: "userId/incidentId.jpg"

// ❌ WRONG - Don't store full URL
photo_url: "https://xxx.supabase.co/storage/v1/object/public/bucket/userId/incidentId.jpg"
```

**Why**: 
- Paths are permanent, URLs can change
- For private buckets, you need to generate signed URLs dynamically
- For public buckets, you can generate public URLs on-demand

**Generate URLs when needed**:

```typescript
// For public buckets
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl(photoPath);
const url = data.publicUrl;

// For private buckets (expires in 1 hour)
const { data } = await supabase.storage
  .from('bucket-name')
  .createSignedUrl(photoPath, 3600);
const url = data.signedUrl;
```

## Business Logic Rules

### Reservation Validation
Before creating a reservation, validate:
1. Date within allowed booking window
2. Date not blocked (global or group-specific)
3. Spot exists and is active
4. Group not scheduled for deactivation
5. Spot not already reserved
6. User has approved license plate
7. User has access to the parking group
8. Special spot requirements (accessible, charger, compact)

Use `validate_parking_spot_reservation()` function for comprehensive checks.

### Cascading Cancellations
Reservations are automatically cancelled when:
- User is blocked or deactivated
- User's license plate is disapproved or deleted
- User is removed from a parking group
- Date is blocked by admin
- Parking group is deactivated

### Soft Deletes
Tables using soft delete pattern:
- `license_plates` - `deleted_at` column
- `parking_groups` - `is_active` flag + `deactivated_at`
- `profiles` - `is_blocked`, `is_deactivated` flags

**Never hard delete** unless explicitly required (GDPR, etc.)

## Common Queries

### Check if user is admin
```sql
SELECT is_admin(auth.uid());
```

### Get available spots for a date
```sql
SELECT * FROM get_available_spots_by_group('group-uuid', '2025-01-15');
```

### Get valid booking date range
```sql
SELECT * FROM get_reservable_date_range();
```

### Cancel user's future reservations
```sql
SELECT cancel_all_user_future_reservations('user-uuid');
```

## Error Handling

### Common Error Codes
- `23505` - Unique constraint violation (duplicate)
- `23503` - Foreign key violation
- `42501` - Insufficient privilege (RLS)
- `P0001` - Raised exception (custom validation)

### Frontend Error Handling
```typescript
try {
  const { data, error } = await supabase.from('table').insert(values)
  if (error) {
    if (error.code === '23505') {
      toast.error('Record already exists')
    } else if (error.code === '42501') {
      toast.error('Permission denied')
    } else {
      toast.error(error.message)
    }
  }
} catch (err) {
  console.error('Unexpected error:', err)
  toast.error('An unexpected error occurred')
}
```

## MCP Integration

**This project has Supabase MCP configured and connected.**

Use these MCP tools to interact with the database:

```typescript
// List all tables
mcp_supabase_reserveo_supabase_list_tables()

// Describe table structure
mcp_supabase_reserveo_supabase_describe_table({ tableName: "reservations" })

// Execute SELECT query
mcp_supabase_reserveo_supabase_query({ 
  query: "SELECT * FROM profiles WHERE is_blocked = false LIMIT 10" 
})

// Count records
mcp_supabase_reserveo_supabase_count_records({ 
  tableName: "reservations",
  filters: { status: "active" }
})

// View RLS policies
mcp_supabase_reserveo_supabase_get_rls_policies({ tableName: "reservations" })

// List migrations
mcp_supabase_reserveo_supabase_list_migrations()

// Read migration content
mcp_supabase_reserveo_supabase_read_migration({ 
  filename: "20251111234017_add_incident_reporting_features.sql" 
})

// Get project info
mcp_supabase_reserveo_supabase_get_project_info()

// Check CLI status
mcp_supabase_reserveo_supabase_cli_status()
```

## Development Best Practices

1. **Always use MCP tools** to inspect database before making changes
2. **Verify project ID** - Current project is `rlrzcfnhhvrvrxzfifeh`
3. **Test locally first** with `supabase start` and local database
4. **Write migrations** for all schema changes, never manual edits
5. **Regenerate types** after every schema change: `supabase gen types typescript --linked > src/integrations/supabase/types.ts`
6. **Use security definer functions** for operations that need elevated privileges
7. **Log important operations** to `reservation_cancellation_log` or audit tables
8. **Provide user feedback** with toast notifications for all mutations
9. **Handle loading states** properly in UI
10. **Invalidate React Query cache** after mutations with `queryClient.invalidateQueries()`
11. **Use transactions** for multi-step operations that must succeed/fail together
12. **Use MCP query tool** for read-only database inspection (safe, no modifications)