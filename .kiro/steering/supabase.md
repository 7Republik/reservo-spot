---
inclusion: always
---

# Supabase Development Guidelines - RESERVEO 

## Current Project Configuration
Siempre hablame en español.
**Project ID**: `rlrzcfnhhvrvrxzfifeh`  
**Project URL**: `https://rlrzcfnhhvrvrxzfifeh.supabase.co`  
**Database Schema**: 12 tables, 20 migrations applied  
**Last Updated**: 2025-11-12

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

## Database Management

### Migration Workflow
- **NEVER modify database schema directly in production**
- Always create migrations: `supabase migration new <name>`
- Test migrations locally: `supabase db reset`
- Apply to production: `supabase db push`
- Regenerate types after schema changes: `supabase gen types typescript --linked > src/integrations/supabase/types.ts`

### MCP Tools Available
Use MCP Supabase tools for database operations:
- `supabase_query` - Execute SELECT queries (read-only for safety)
- `supabase_list_tables` - List all tables in public schema
- `supabase_describe_table` - Get table structure (columns, types, constraints)
- `supabase_list_migrations` - List migration files
- `supabase_read_migration` - Read migration content
- `supabase_count_records` - Count records with optional filters
- `supabase_get_rls_policies` - View Row Level Security policies

### Key Database Patterns

**13 Active Tables** (verified via MCP):
1. `profiles` - User profiles (extends auth.users)
2. `user_roles` - Role assignments (general, visitor, preferred, director, admin)
3. `user_warnings` - User warning system (tracks violations)
4. `parking_groups` - Parking zones/floors (includes is_incident_reserve flag)
5. `parking_spots` - Individual parking spaces
6. `reservations` - Parking reservations
7. `license_plates` - Vehicle plates (require approval)
8. `user_group_assignments` - User access to parking groups
9. `blocked_dates` - Dates when reservations are blocked
10. `reservation_settings` - Global configuration (singleton)
11. `reservation_cancellation_log` - Audit trail
12. `incident_reports` - Problem reports with photo support (photo_url column)
13. `user_warnings` - Warnings issued to users for parking violations

**20 Migrations Applied** (from 2025-11-05 to 2025-11-12):
- Initial schema setup
- Parking groups and visual editor
- License plate management
- Reservation validation
- User blocking/deactivation
- Incident reporting with photos (photo_url column)
- User warnings system
- Incident reserve groups (is_incident_reserve flag)
- Storage bucket: incident-photos (created manually, RLS policies applied)

**Critical Functions:**
- `is_admin(user_id)` - Check admin role
- `has_role(user_id, role)` - Check specific role
- `get_user_role_priority(user_id)` - Get role priority (1-5)
- `is_user_active(user_id)` - Check if user is not blocked/deactivated
- `validate_parking_spot_reservation()` - Comprehensive reservation validation
- `get_reservable_date_range()` - Calculate valid booking window
- `cancel_all_user_future_reservations()` - Cancel user's future bookings
- `find_available_spot_for_incident(user_id, date, original_spot_id)` - Find alternative spot for incident reassignment
- `get_user_warning_count(user_id)` - Get total warnings for a user

**Automatic Triggers:**
- `on_auth_user_created` - Auto-create profile + assign 'general' role
- `on_user_blocked_or_deactivated` - Cancel reservations when user blocked
- `on_license_plate_removed` - Cancel reservations when plate disapproved
- `on_user_group_assignment_deleted` - Cancel reservations when group access removed

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