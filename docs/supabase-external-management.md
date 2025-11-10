# Gestión de Supabase Cloud desde IDE Externo

Guía completa para gestionar la base de datos de Supabase/Cloud conectada a Reserveo desde tu IDE favorito.

## 📋 Tabla de Contenidos

- [Información del Proyecto](#información-del-proyecto)
- [Configuración Inicial](#configuración-inicial)
- [Desarrollo Local con Supabase CLI](#desarrollo-local-con-supabase-cli)
- [Gestión de Migraciones](#gestión-de-migraciones)
- [Conexión Directa a la Base de Datos](#conexión-directa-a-la-base-de-datos)
- [Workflows Recomendados](#workflows-recomendados)
- [Troubleshooting](#troubleshooting)

---

## Información del Proyecto

### Credenciales de Supabase Cloud

**🔑 CLAVES PÚBLICAS (Safe para Frontend)**
```bash
# Project ID
pevpefnemqvyygkrcwir

# Project URL
https://pevpefnemqvyygkrcwir.supabase.co

# Anon Key (público - safe para cliente)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldnBlZm5lbXF2eXlna3Jjd2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjgyMTksImV4cCI6MjA3Nzk0NDIxOX0.A7iro-wAVpeHGyC9UtKI3TVIATQ8uOH84FEF-twfpP8

# API URL (REST)
https://pevpefnemqvyygkrcwir.supabase.co/rest/v1/
```

**🔐 CLAVES SENSIBLES DE SUPERADMIN**

⚠️ **CRÍTICO**: Estas claves otorgan acceso total. NUNCA las expongas en frontend o repositorios públicos.

```bash
# Service Role Key (BYPASS RLS - acceso total)
# Disponible en: Dashboard → Settings → API → service_role key
# Esta clave NO está expuesta aquí por seguridad.
# Obtenerla desde: https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/settings/api

# Database Password (Conexión directa PostgreSQL)
# Disponible en: Dashboard → Settings → Database → Database Password
# Si no la tienes, puedes resetearla desde el dashboard.

# JWT Secret (Verificación de tokens)
# Disponible en: Dashboard → Settings → API → JWT Settings
# Usado para verificar y firmar tokens JWT.
```

**🌐 URLs de Acceso Administrativo**
```bash
# Dashboard Principal
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir

# Table Editor
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/editor

# SQL Editor
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/sql/new

# Authentication
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/auth/users

# Storage
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/storage/buckets

# Database (Physical)
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/database/tables

# Logs & Monitoring
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/logs/explorer

# API Docs (Auto-generated)
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/api
```

**🔌 Conexión Directa a PostgreSQL (Superadmin)**
```bash
# Connection String (Pooler - Recomendado para apps)
postgresql://postgres.pevpefnemqvyygkrcwir:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Connection String (Direct - Para admin/migraciones)
postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres

# Host Direct
db.pevpefnemqvyygkrcwir.supabase.co

# Host Pooler (Connection Pooling)
aws-0-eu-central-1.pooler.supabase.com

# Port
5432

# Database
postgres

# User
postgres

# SSL Mode
require
```

### Variables de Entorno

Crea un archivo `.env.local` en la raíz de tu proyecto:

```bash
# .env.local
VITE_SUPABASE_URL=https://pevpefnemqvyygkrcwir.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldnBlZm5lbXF2eXlna3Jjd2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjgyMTksImV4cCI6MjA3Nzk0NDIxOX0.A7iro-wAVpeHGyC9UtKI3TVIATQ8uOH84FEF-twfpP8
VITE_SUPABASE_PROJECT_ID=pevpefnemqvyygkrcwir

# Para desarrollo local (ver sección de Supabase CLI)
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=tu-local-anon-key
```

**Para desarrollo con Service Role (SUPERADMIN - backend only):**
```bash
# .env.server (NUNCA COMMITEAR)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
SUPABASE_URL=https://pevpefnemqvyygkrcwir.supabase.co
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres
```

**Agregar a `.gitignore`:**
```
.env.local
.env*.local
.env.server
.env.production
**/.env
```

---

## Configuración Inicial

### 1. Instalar Supabase CLI

**macOS / Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**NPM (alternativa):**
```bash
npm install -g supabase
```

**Verificar instalación:**
```bash
supabase --version
```

### 2. Iniciar Sesión en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Supabase.

### 3. Vincular tu Proyecto Local al Cloud

En la raíz de tu proyecto:

```bash
supabase link --project-ref pevpefnemqvyygkrcwir
```

Te pedirá la **database password**. Si no la tienes, puedes resetearla desde:
- Dashboard de Supabase → Settings → Database → Database Password → Reset

**Verificar vinculación:**
```bash
supabase status
```

---

## Desarrollo Local con Supabase CLI

### Iniciar Supabase Localmente

**Primera vez:**
```bash
# Inicializar estructura de carpetas (ya existe en tu proyecto)
# supabase init

# Iniciar servicios locales (PostgreSQL, Auth, Storage, etc.)
supabase start
```

Esto levantará:
- **PostgreSQL**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **API**: `http://localhost:54321`
- **Studio (UI)**: `http://localhost:54323`
- **Inbucket (emails)**: `http://localhost:54324`

**Obtener credenciales locales:**
```bash
supabase status
```

Output esperado:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJhbG... (local anon key)
Service role key: eyJhbG... (local service role key)
```

**Actualizar `.env.local` para desarrollo local:**
```bash
# Comentar las de producción y usar las locales
# VITE_SUPABASE_URL=https://pevpefnemqvyygkrcwir.supabase.co
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-status>
```

### Detener Servicios Locales

```bash
supabase stop
```

### Sincronizar Base de Datos Local con Cloud

**Bajar esquema y datos de producción:**
```bash
# Solo esquema (estructura)
supabase db pull

# Con datos (cuidado, puede ser pesado)
supabase db dump --data-only > seed.sql
supabase db reset
```

---

## Gestión de Migraciones

### Estructura de Migraciones

```
supabase/
├── config.toml          # Configuración del proyecto
└── migrations/          # Migraciones SQL (read-only en Lovable)
    ├── 20250101000000_initial_schema.sql
    ├── 20250102000000_add_license_plates.sql
    └── ...
```

### Crear Nueva Migración

**Método 1: Desde cambios en DB local**
```bash
# 1. Hacer cambios en Studio local (http://localhost:54323)
# 2. Generar migración desde los cambios
supabase db diff -f nombre_de_tu_migracion
```

Esto crea un archivo en `supabase/migrations/` con timestamp.

**Método 2: Crear archivo manualmente**
```bash
# Crear archivo con timestamp
supabase migration new nombre_de_tu_migracion
```

Editar el archivo creado con tu SQL:
```sql
-- Ejemplo: supabase/migrations/20250110120000_add_notes_table.sql

-- Crear tabla de notas
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own notes"
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Aplicar Migraciones Localmente

```bash
# Aplicar migraciones pendientes a BD local
supabase db reset

# O aplicar solo la última
supabase migration up
```

### Aplicar Migraciones a Producción (Cloud)

```bash
# Revisar qué migraciones están pendientes
supabase db diff

# Aplicar todas las migraciones pendientes a producción
supabase db push
```

⚠️ **CRÍTICO**: Siempre prueba migraciones en local antes de aplicarlas a producción.

### Ver Estado de Migraciones

```bash
# Listar migraciones aplicadas en producción
supabase migration list --linked

# Ver diferencias entre local y remoto
supabase db diff
```

---

## Conexión Directa a la Base de Datos

### Conectar con Cliente SQL (DBeaver, DataGrip, pgAdmin)

**Credenciales de Conexión:**

```
Host: db.pevpefnemqvyygkrcwir.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [tu database password]
SSL Mode: require
```

**Connection String completo:**
```
postgresql://postgres:[password]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres?sslmode=require
```

### Obtener Database Password

Si no tienes la contraseña:

1. Ve a **Supabase Dashboard** → https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir
2. Settings → Database
3. Database Password → Reset Password
4. Guarda la contraseña en tu gestor de contraseñas

### Conectar con `psql` (Terminal)

```bash
# Usando CLI de Supabase (recomendado)
supabase db remote psql

# O directamente con psql
psql "postgresql://postgres:[password]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres?sslmode=require"
```

### Comandos Útiles en `psql`

```sql
-- Listar todas las tablas
\dt public.*

-- Describir una tabla
\d public.profiles

-- Ver políticas RLS
\dp public.profiles

-- Ver funciones
\df public.*

-- Ejecutar query
SELECT * FROM profiles LIMIT 10;

-- Salir
\q
```

---

## Workflows Recomendados

### Workflow 1: Desarrollo de Feature con Cambios de DB

```bash
# 1. Levantar Supabase local
supabase start

# 2. Trabajar en tu feature (código + cambios de DB en Studio local)
# http://localhost:54323

# 3. Generar migración desde cambios
supabase db diff -f add_feature_x

# 4. Aplicar localmente para verificar
supabase db reset

# 5. Testear tu feature localmente
npm run dev

# 6. Commit de la migración
git add supabase/migrations/*.sql
git commit -m "feat: add feature X with DB changes"

# 7. Aplicar a producción
supabase db push
```

### Workflow 2: Solo Cambios de Código (sin DB)

```bash
# 1. Trabajar normalmente con tu IDE
# (los cambios de código no requieren Supabase CLI)

# 2. Testear localmente apuntando a Cloud
# (usar .env.local con credenciales de producción)
npm run dev

# 3. Commit y push
git add .
git commit -m "feat: improve UI"
git push
```

### Workflow 3: Revisar y Sincronizar DB de Producción

```bash
# 1. Ver cambios remotos (que no están en local)
supabase db diff --linked

# 2. Si hay cambios, bajarlos como migración
supabase db pull

# 3. Aplicar localmente
supabase db reset

# 4. Revisar y commit
git add supabase/migrations/*.sql
git commit -m "sync: pull remote DB changes"
```

---

## Gestión de Tipos TypeScript

### Generar Tipos desde Base de Datos

Supabase genera tipos TypeScript automáticamente:

```bash
# Generar tipos desde DB remota
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# O desde DB local
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

**En este proyecto (Lovable)**, el archivo `src/integrations/supabase/types.ts` es **read-only** y se regenera automáticamente. En tu IDE externo, debes regenerarlo manualmente después de cada cambio de esquema.

**Agregar a tu workflow:**
```bash
# Después de aplicar migraciones
supabase db push
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Commit de los tipos actualizados
git add src/integrations/supabase/types.ts
git commit -m "chore: update DB types"
```

---

## Edge Functions (Serverless)

### Estructura de Edge Functions

```
supabase/functions/
├── mi-funcion/
│   └── index.ts
└── otra-funcion/
    └── index.ts
```

### Crear Nueva Edge Function

```bash
supabase functions new mi-funcion
```

Esto crea `supabase/functions/mi-funcion/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    const data = {
      message: `Hello ${name}!`,
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})
```

### Ejecutar Edge Function Localmente

```bash
# Servir función localmente
supabase functions serve mi-funcion

# Probar con curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/mi-funcion' \
  --header 'Authorization: Bearer YOUR-ANON-KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"World"}'
```

### Desplegar Edge Function a Producción

```bash
# Desplegar una función
supabase functions deploy mi-funcion

# Desplegar todas las funciones
supabase functions deploy

# Ver logs de la función en producción
supabase functions logs mi-funcion --limit 10
```

### Gestionar Secrets para Edge Functions

```bash
# Listar secrets
supabase secrets list

# Agregar secret
supabase secrets set MY_SECRET_KEY=valor-secreto

# Eliminar secret
supabase secrets unset MY_SECRET_KEY
```

Usar secrets en tu Edge Function:
```typescript
const secretKey = Deno.env.get('MY_SECRET_KEY')
```

---

## Storage (Archivos)

### Crear Bucket

```bash
# Vía CLI
supabase storage create mi-bucket --public

# O en Studio (http://localhost:54323 o dashboard remoto)
```

### Gestionar Archivos

**Desde código (TypeScript):**
```typescript
import { supabase } from '@/integrations/supabase/client'

// Subir archivo
const { data, error } = await supabase.storage
  .from('mi-bucket')
  .upload('carpeta/archivo.png', file)

// Descargar URL pública
const { data: publicURL } = supabase.storage
  .from('mi-bucket')
  .getPublicUrl('carpeta/archivo.png')

// Eliminar archivo
await supabase.storage
  .from('mi-bucket')
  .remove(['carpeta/archivo.png'])
```

### Políticas de Storage (RLS)

Agregar en migración SQL:
```sql
-- Permitir uploads solo a usuarios autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mi-bucket');

-- Permitir que usuarios vean sus propios archivos
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mi-bucket' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Troubleshooting

### 1. "Error: Cannot link project"

**Problema:** No puedes vincular el proyecto local.

**Solución:**
```bash
# Verificar autenticación
supabase logout
supabase login

# Reintentar link
supabase link --project-ref pevpefnemqvyygkrcwir --password [tu-db-password]
```

### 2. "Migration already exists remotely"

**Problema:** Intentas aplicar una migración que ya existe en producción.

**Solución:**
```bash
# Ver estado de migraciones
supabase migration list --linked

# Si local está desactualizado, bajar esquema remoto
supabase db pull

# Aplicar localmente
supabase db reset
```

### 3. "Types are out of sync"

**Problema:** Los tipos TypeScript no coinciden con la DB.

**Solución:**
```bash
# Regenerar tipos
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Reiniciar TypeScript server en tu IDE
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 4. "Cannot connect to local database"

**Problema:** Servicios locales no arrancan.

**Solución:**
```bash
# Detener todo
supabase stop

# Limpiar volúmenes (CUIDADO: borra datos locales)
supabase stop --no-backup

# Reiniciar
supabase start
```

### 5. "RLS policy violation"

**Problema:** No puedes insertar/actualizar datos.

**Diagnóstico:**
```sql
-- Conectar a DB
supabase db remote psql

-- Ver políticas de la tabla
\dp public.mi_tabla

-- Verificar auth
SELECT auth.uid();
```

**Solución:** Revisar políticas RLS y asegurarte de que el usuario está autenticado.

### 6. "Edge function deployment failed"

**Problema:** La función no se despliega.

**Solución:**
```bash
# Ver logs detallados
supabase functions deploy mi-funcion --debug

# Verificar sintaxis localmente
supabase functions serve mi-funcion
```

### 7. "Migration conflicts"

**Problema:** Migraciones en conflicto entre local y remoto.

**Solución:**
```bash
# Ver diferencias
supabase db diff

# Opción 1: Resetear local con estado remoto
supabase db pull
supabase db reset

# Opción 2: Forzar push (PELIGROSO)
supabase db push --dry-run  # primero ver qué pasaría
supabase db push  # solo si estás seguro
```

---

## Gestión Avanzada de Superadmin

### Acceso Directo con Service Role Key

**⚠️ USO EXCLUSIVO BACKEND - NUNCA EN FRONTEND**

El Service Role Key bypasea TODAS las políticas RLS y otorga acceso administrativo completo.

**Obtener Service Role Key:**
1. Dashboard → Settings → API
2. Copiar `service_role` key (empieza con `eyJ...`)

**Uso en Scripts de Administración:**
```typescript
// admin-script.ts (SOLO ejecutar en servidor/local)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://pevpefnemqvyygkrcwir.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role Key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Acceso total - bypassea RLS
const { data: allUsers } = await supabaseAdmin
  .from('profiles')
  .select('*')  // Ve TODO sin restricciones

// Crear usuarios programáticamente
const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'nuevo@admin.com',
  password: 'password123',
  email_confirm: true
})
```

### Gestión de Usuarios desde SQL (Superadmin)

**Conectarse como superadmin:**
```bash
supabase db remote psql
# O
psql "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres?sslmode=require"
```

**Ver todos los usuarios (auth.users):**
```sql
-- Listar usuarios con su estado
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  banned_until,
  deleted_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 50;

-- Ver usuarios con sus roles
SELECT 
  u.email,
  u.created_at,
  array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;
```

**Crear usuario manualmente (con confirmación automática):**
```sql
-- Función helper para crear usuario admin
CREATE OR REPLACE FUNCTION public.create_admin_user(
  _email TEXT,
  _password TEXT,
  _full_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    _email,
    crypt(_password, gen_salt('bf')),
    NOW(),
    json_build_object('full_name', _full_name),
    NOW(),
    NOW()
  ) RETURNING id INTO _user_id;
  
  -- Crear perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (_user_id, _email, _full_name);
  
  -- Asignar rol de admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin');
  
  RETURN _user_id;
END;
$$;

-- Usar la función
SELECT create_admin_user('superadmin@reserveo.com', 'SecurePass123!', 'Super Admin');
```

**Banear/Desbanear usuarios:**
```sql
-- Banear usuario por 7 días
UPDATE auth.users
SET banned_until = NOW() + INTERVAL '7 days'
WHERE email = 'usuario@ejemplo.com';

-- Banear permanentemente
UPDATE auth.users
SET banned_until = '2099-12-31'
WHERE email = 'usuario@ejemplo.com';

-- Desbanear
UPDATE auth.users
SET banned_until = NULL
WHERE email = 'usuario@ejemplo.com';
```

**Eliminar usuario completamente (hard delete):**
```sql
-- CUIDADO: Esto borra TODO
-- auth.users tiene CASCADE, borrará automáticamente profiles, reservations, etc.
DELETE FROM auth.users WHERE email = 'usuario@eliminar.com';
```

**Cambiar contraseña de usuario:**
```sql
UPDATE auth.users
SET encrypted_password = crypt('NuevaPassword123', gen_salt('bf'))
WHERE email = 'usuario@ejemplo.com';
```

**Confirmar email manualmente:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'usuario@confirmar.com';
```

### Backup y Restore

**Backup Completo (Superadmin):**
```bash
# Backup completo de la BD
pg_dump "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo esquema (sin datos)
pg_dump --schema-only \
  "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  > schema_backup.sql

# Backup solo datos (sin estructura)
pg_dump --data-only \
  "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  > data_backup.sql

# Backup de tabla específica
pg_dump -t public.profiles \
  "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  > profiles_backup.sql

# Backup comprimido (recomendado para producción)
pg_dump -Fc \
  "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  > backup_$(date +%Y%m%d).dump
```

**Restore:**
```bash
# Restore desde SQL
psql "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  < backup_20250110.sql

# Restore desde dump comprimido
pg_restore -d "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  backup_20250110.dump

# Restore solo una tabla
pg_restore -t profiles \
  -d "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" \
  backup_20250110.dump
```

**Automatizar Backups (crontab):**
```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 3 AM
0 3 * * * pg_dump "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" > /backups/reserveo_$(date +\%Y\%m\%d).sql

# Backup semanal comprimido (domingos 2 AM)
0 2 * * 0 pg_dump -Fc "postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres" > /backups/weekly/reserveo_$(date +\%Y\%m\%d).dump

# Limpiar backups antiguos (mantener últimos 30 días)
0 4 * * * find /backups -name "reserveo_*.sql" -mtime +30 -delete
```

### Monitoreo y Performance

**Ver Queries Lentas:**
```sql
-- Top 10 queries más lentas (requiere pg_stat_statements)
SELECT 
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as mean_seconds,
  max_exec_time / 1000 as max_seconds
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Queries activas en este momento
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query,
  query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Matar query problemática (si es necesario)
SELECT pg_cancel_backend(12345);  -- reemplazar con PID
-- O forzar terminación
SELECT pg_terminate_backend(12345);
```

**Ver Tamaño de Tablas:**
```sql
-- Tamaño de cada tabla
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Tamaño total de la BD
SELECT pg_size_pretty(pg_database_size('postgres'));
```

**Ver Índices:**
```sql
-- Índices no usados (candidatos a eliminar)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey'
ORDER BY tablename;

-- Índices duplicados
SELECT 
  pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS size,
  (array_agg(idx))[1] AS idx1,
  (array_agg(idx))[2] AS idx2,
  (array_agg(idx))[3] AS idx3,
  (array_agg(idx))[4] AS idx4
FROM (
  SELECT 
    indexrelid::regclass AS idx,
    indrelid::regclass AS tbl,
    indkey::text AS cols
  FROM pg_index
) sub
GROUP BY tbl, cols
HAVING COUNT(*) > 1;
```

**Vacuum y Analyze (Mantenimiento):**
```sql
-- Vacuum completo (recuperar espacio)
VACUUM FULL VERBOSE;

-- Vacuum solo una tabla
VACUUM FULL VERBOSE public.reservations;

-- Analyze (actualizar estadísticas del optimizador)
ANALYZE;

-- Ver última vez que se hizo vacuum/analyze
SELECT 
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum DESC NULLS LAST;
```

### Gestión de Secrets (CLI)

**Listar todos los secrets:**
```bash
supabase secrets list
```

**Agregar secrets en batch:**
```bash
# Desde archivo .env
supabase secrets set --env-file .env.production

# Individual
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set SENDGRID_API_KEY=SG...
```

**Ver valor de un secret (solo con service role):**
```bash
# Los secrets NO se pueden leer directamente por seguridad
# Si necesitas verificar, mejor eliminarlo y recrearlo
supabase secrets unset MY_SECRET
supabase secrets set MY_SECRET=nuevo-valor
```

### Gestión de Storage Avanzada

**Ver tamaño de buckets:**
```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY SUM((metadata->>'size')::bigint) DESC;
```

**Limpiar archivos huérfanos (sin referencias):**
```sql
-- Identificar archivos en storage sin usuario asociado
SELECT 
  so.name,
  so.created_at,
  pg_size_pretty((so.metadata->>'size')::bigint) as size
FROM storage.objects so
WHERE so.bucket_id = 'floor-plans'
AND NOT EXISTS (
  SELECT 1 FROM parking_groups pg 
  WHERE pg.floor_plan_url LIKE '%' || so.name || '%'
)
ORDER BY so.created_at DESC;

-- Eliminar archivos huérfanos (CUIDADO)
-- DELETE FROM storage.objects WHERE id IN (...);
```

**Políticas de Storage para Superadmin:**
```sql
-- Admin puede ver y gestionar TODO en storage
CREATE POLICY "Admins have full access to all storage"
ON storage.objects
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
```

### Auditoría y Logs

**Ver logs de auth (últimos intentos de login):**
```bash
# Vía Dashboard
https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir/logs/explorer

# Query ejemplo en Logs Explorer:
# Filtrar por auth errors
# timestamp > now() - interval '1 hour'
# AND metadata.level = 'error'
```

**Crear tabla de auditoría (tracking de cambios críticos):**
```sql
-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);

-- Función para registrar cambios
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a tablas críticas
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_reservations
AFTER INSERT OR UPDATE OR DELETE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION log_audit();
```

**Consultar auditoría:**
```sql
-- Ver últimas acciones de un usuario
SELECT 
  action,
  table_name,
  created_at,
  new_data
FROM audit_log
WHERE user_id = 'USER_UUID'
ORDER BY created_at DESC
LIMIT 50;

-- Ver cambios en una tabla específica
SELECT * FROM audit_log
WHERE table_name = 'user_roles'
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Ver quién modificó un registro específico
SELECT 
  u.email,
  al.action,
  al.created_at,
  al.old_data,
  al.new_data
FROM audit_log al
JOIN auth.users u ON al.user_id = u.id
WHERE al.record_id = 'RECORD_UUID'
ORDER BY al.created_at DESC;
```

### Limpieza y Mantenimiento

**Eliminar datos antiguos (GDPR compliance):**
```sql
-- Eliminar usuarios inactivos por más de 2 años
DELETE FROM auth.users
WHERE last_sign_in_at < NOW() - INTERVAL '2 years'
AND email NOT LIKE '%@admin.com';

-- Eliminar reservas antiguas (más de 1 año)
DELETE FROM public.reservations
WHERE reservation_date < CURRENT_DATE - INTERVAL '1 year';

-- Archivar logs de auditoría antiguos
CREATE TABLE audit_log_archive AS
SELECT * FROM audit_log
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '1 year';
```

**Optimizar tablas grandes:**
```sql
-- Reindexar tabla
REINDEX TABLE public.reservations;

-- Clustering (reorganizar físicamente por índice)
CLUSTER public.reservations USING reservations_pkey;

-- Vacuum con estadísticas
VACUUM ANALYZE public.reservations;
```

### Scripts de Utilidad (Bash)

**`scripts/db-health-check.sh`**
```bash
#!/bin/bash
# Chequeo de salud de la base de datos

DB_URL="postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres"

echo "=== DATABASE HEALTH CHECK ==="
echo ""

echo "📊 Database Size:"
psql "$DB_URL" -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
echo ""

echo "📋 Top 5 Largest Tables:"
psql "$DB_URL" -c "
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 5;
"
echo ""

echo "🔍 Active Connections:"
psql "$DB_URL" -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state != 'idle';"
echo ""

echo "⏱️  Slow Queries (>1s):"
psql "$DB_URL" -c "
SELECT 
  query,
  calls,
  mean_exec_time / 1000 as mean_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 5;
"
echo ""

echo "✅ Health Check Complete"
```

**`scripts/backup-production.sh`**
```bash
#!/bin/bash
# Backup automatizado de producción

BACKUP_DIR="/backups/reserveo"
DATE=$(date +%Y%m%d_%H%M%S)
DB_URL="postgresql://postgres:[PASSWORD]@db.pevpefnemqvyygkrcwir.supabase.co:5432/postgres"

mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup..."

# Backup completo comprimido
pg_dump -Fc "$DB_URL" > "$BACKUP_DIR/full_$DATE.dump"

# Backup solo esquema (para versionado)
pg_dump --schema-only "$DB_URL" > "$BACKUP_DIR/schema_$DATE.sql"

# Comprimir
gzip "$BACKUP_DIR/schema_$DATE.sql"

echo "✅ Backup completed: $BACKUP_DIR/full_$DATE.dump"

# Limpiar backups antiguos (mantener 30 días)
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "🧹 Old backups cleaned"
```

Hacer ejecutables:
```bash
chmod +x scripts/*.sh
```

---

## Recursos Adicionales

**Documentación Oficial:**
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/managing-migrations)
- [Edge Functions](https://supabase.com/docs/guides/functions)

**Dashboard de tu Proyecto:**
- [Supabase Dashboard](https://supabase.com/dashboard/project/pevpefnemqvyygkrcwir)

**Guías del Proyecto Reserveo:**
- [Guía Técnica Completa](.lovable/technical-guide.md) (cuando esté creada)
- [README de Hooks Admin](../src/hooks/admin/README.md)
- [README de Componentes](../src/components/README.md)

---

## Checklist: Configuración Completa de Superadmin

### Accesos Críticos
- [ ] Service Role Key obtenida desde Dashboard → Settings → API
- [ ] Database Password configurada/reseteada
- [ ] JWT Secret documentado (Settings → API → JWT Settings)
- [ ] Acceso al Dashboard de Supabase verificado
- [ ] Conexión directa PostgreSQL testeada (psql o cliente SQL)
- [ ] Acceso a Logs & Monitoring configurado

### Seguridad
- [ ] Service Role Key guardada en gestor de contraseñas (1Password, Bitwarden, etc.)
- [ ] `.env.server` creado y agregado a `.gitignore`
- [ ] Nunca commitear claves sensibles al repositorio
- [ ] Backup de credenciales en lugar seguro (offline)
- [ ] 2FA habilitado en cuenta de Supabase
- [ ] Políticas RLS revisadas y funcionando correctamente

### Herramientas
- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] Autenticado en Supabase (`supabase login`)
- [ ] Proyecto vinculado (`supabase link --project-ref pevpefnemqvyygkrcwir`)
- [ ] Cliente SQL instalado (DBeaver/DataGrip/pgAdmin/psql)
- [ ] Scripts de backup configurados
- [ ] Crontab de backups automáticos activado (opcional)

### Monitoreo
- [ ] Alertas configuradas en Dashboard (Settings → Alerts)
- [ ] Script de health check probado (`scripts/db-health-check.sh`)
- [ ] Queries lentas monitoreadas regularmente
- [ ] Tabla de auditoría (`audit_log`) implementada
- [ ] Logs de auth revisados periódicamente

### Backups
- [ ] Backup manual exitoso realizado y probado
- [ ] Restore de backup probado en ambiente local
- [ ] Directorio de backups configurado (`/backups/reserveo`)
- [ ] Política de retención definida (ej: 30 días)
- [ ] Backups offsite/cloud configurados (AWS S3, Google Drive, etc.)

### Desarrollo
- [ ] Supabase local iniciado (`supabase start`)
- [ ] Studio local accesible (http://localhost:54323)
- [ ] Tipos TypeScript generados (`supabase gen types typescript`)
- [ ] Migraciones sincronizadas entre local y remoto
- [ ] Edge functions desplegadas y funcionando

---

## ⚠️ Consideraciones de Seguridad CRÍTICAS

### 🔴 NUNCA HACER:

1. **Exponer Service Role Key en frontend**
   ```typescript
   // ❌ NUNCA HACER ESTO
   const supabase = createClient(url, SERVICE_ROLE_KEY)  // En código cliente
   ```

2. **Commitear credenciales al repositorio**
   ```bash
   # ❌ PELIGRO
   git add .env.server
   git commit -m "add credentials"  # NUNCA
   ```

3. **Compartir passwords en Slack/Email/WhatsApp**
   - Usar gestores de contraseñas con links temporales
   - O servicios como onetimesecret.com para compartir

4. **Deshabilitar RLS en producción**
   ```sql
   -- ❌ NUNCA EN PRODUCCIÓN
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
   ```

5. **Usar `postgres` user desde aplicación**
   - El user `postgres` es solo para admin
   - La app debe usar `anon` key o autenticación JWT

### 🟢 SIEMPRE HACER:

1. **Variables de entorno separadas por ambiente**
   ```bash
   .env.local       # Desarrollo local
   .env.staging     # Staging (si existe)
   .env.production  # Producción (NUNCA commitear)
   ```

2. **Service Role solo en backend**
   ```typescript
   // ✅ CORRECTO - En Edge Function o API privada
   const supabaseAdmin = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
   )
   ```

3. **Revisar RLS antes de cada despliegue**
   ```bash
   supabase db linter  # Ejecutar antes de db push
   ```

4. **Monitorear accesos sospechosos**
   ```sql
   -- Ver últimos intentos de login fallidos
   SELECT 
     metadata->>'email' as email,
     timestamp,
     metadata->>'error' as error
   FROM auth_logs
   WHERE metadata->>'level' = 'error'
   AND timestamp > NOW() - INTERVAL '1 day'
   ORDER BY timestamp DESC;
   ```

5. **Backup antes de migraciones críticas**
   ```bash
   # Siempre antes de cambios destructivos
   pg_dump -Fc "$DB_URL" > pre_migration_backup.dump
   ```

### 🛡️ Hardening de Seguridad

**Restringir acceso por IP (opcional):**
- Dashboard → Settings → Database → Connection Pooling
- Agregar IPs permitidas

**Rotar credenciales periódicamente:**
```bash
# Cada 3-6 meses
# 1. Dashboard → Settings → Database → Reset Password
# 2. Dashboard → Settings → API → Regenerate Service Role Key (cuidado!)
# 3. Actualizar en todos los ambientes
```

**Habilitar alertas:**
- Dashboard → Settings → Alerts
- Configurar notificaciones para:
  - Uso de cuota (>80%)
  - Errores frecuentes (>100/min)
  - Queries lentas (>5s)

---

## Troubleshooting de Superadmin

### "Cannot connect with service_role key"

**Problema:** Error al usar Service Role Key.

**Diagnóstico:**
```bash
# Verificar que la key es correcta
curl https://pevpefnemqvyygkrcwir.supabase.co/rest/v1/profiles \
  -H "apikey: TU_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer TU_SERVICE_ROLE_KEY"
```

**Solución:**
- Verificar que la key es la `service_role` (no `anon`)
- Dashboard → Settings → API → Project API keys
- Si regeneraste la key, actualizar en TODOS los ambientes

### "Database connection refused"

**Problema:** No puedes conectar directamente a PostgreSQL.

**Diagnóstico:**
```bash
# Test de conexión
pg_isready -h db.pevpefnemqvyygkrcwir.supabase.co -p 5432
```

**Solución:**
1. Verificar password (Dashboard → Settings → Database)
2. Usar SSL Mode `require`
3. Verificar firewall/VPN no bloquea puerto 5432
4. Probar con pooler: `aws-0-eu-central-1.pooler.supabase.com`

### "Migration failed with constraint violation"

**Problema:** Migración falla por datos existentes incompatibles.

**Solución:**
```sql
-- Opción 1: Limpiar datos incompatibles primero
DELETE FROM public.tabla WHERE condicion_incompatible;

-- Opción 2: Migración en dos pasos
-- Paso 1: Agregar columna nullable
ALTER TABLE public.tabla ADD COLUMN nueva_col TEXT;

-- Paso 2: Populación de datos
UPDATE public.tabla SET nueva_col = 'valor_default' WHERE nueva_col IS NULL;

-- Paso 3: Hacer NOT NULL
ALTER TABLE public.tabla ALTER COLUMN nueva_col SET NOT NULL;
```

### "RLS policy blocks admin operations"

**Problema:** Hasta los admins son bloqueados por RLS.

**Diagnóstico:**
```sql
-- Verificar si is_admin() funciona
SELECT public.is_admin(auth.uid());

-- Ver qué rol tiene tu usuario
SELECT role FROM user_roles WHERE user_id = auth.uid();
```

**Solución:**
```sql
-- Opción 1: Agregar policy para admin
CREATE POLICY "Admins bypass restrictions"
ON public.tabla_problematica
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Opción 2: Usar service_role desde código (bypasea RLS)
-- (solo en backend)
```

### "Storage bucket is full"

**Problema:** No puedes subir más archivos.

**Diagnóstico:**
```sql
-- Ver uso de storage
SELECT 
  bucket_id,
  COUNT(*) as files,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

**Solución:**
```bash
# Aumentar límite en Dashboard → Settings → Billing

# O limpiar archivos viejos
DELETE FROM storage.objects
WHERE bucket_id = 'floor-plans'
AND created_at < NOW() - INTERVAL '6 months';
```

### "Cannot drop table - dependent objects"

**Problema:** No puedes eliminar tabla por dependencias.

**Diagnóstico:**
```sql
-- Ver dependencias
SELECT 
  dependent_view.relname as dependent_view
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
WHERE source_table.relname = 'mi_tabla';
```

**Solución:**
```sql
-- Opción 1: CASCADE (cuidado, borra dependencias)
DROP TABLE mi_tabla CASCADE;

-- Opción 2: Eliminar dependencias manualmente primero
DROP VIEW vista_dependiente;
DROP TABLE mi_tabla;
```

### "Edge function times out"

**Problema:** Edge function no responde.

**Diagnóstico:**
```bash
# Ver logs
supabase functions logs mi-funcion --limit 50

# Probar localmente
supabase functions serve mi-funcion --no-verify-jwt
```

**Solución:**
- Aumentar timeout en config.toml
- Optimizar queries pesadas
- Usar background jobs para operaciones lentas

### "Database is running out of space"

**Problema:** Base de datos cerca del límite de almacenamiento.

**Diagnóstico:**
```sql
-- Ver tamaño total
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Identificar tablas grandes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

**Solución:**
```sql
-- Vacuum full (recuperar espacio)
VACUUM FULL;

-- Archivar datos antiguos
-- (mover a tabla de archivo o eliminar)
DELETE FROM public.audit_log WHERE created_at < NOW() - INTERVAL '1 year';

-- Upgrade plan en Dashboard si es necesario
```

### "Queries are very slow"

**Problema:** Performance degradada.

**Diagnóstico:**
```sql
-- Queries lentas actualmente
SELECT 
  pid,
  now() - query_start as duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Índices faltantes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;  -- Candidatos para índice
```

**Solución:**
```sql
-- Agregar índices
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Analyze
ANALYZE;

-- Verificar mejora
EXPLAIN ANALYZE
SELECT * FROM reservations WHERE reservation_date = '2025-01-15';
```

---

**Última actualización:** 2025-11-10  
**Versión:** 2.0.0 (Superadmin Edition)  
**Proyecto:** Reserveo  
**Supabase Project ID:** pevpefnemqvyygkrcwir
