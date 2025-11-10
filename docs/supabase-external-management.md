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

```bash
# Project ID
pevpefnemqvyygkrcwir

# Project URL
https://pevpefnemqvyygkrcwir.supabase.co

# Anon Key (público - safe para frontend)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldnBlZm5lbXF2eXlna3Jjd2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjgyMTksImV4cCI6MjA3Nzk0NDIxOX0.A7iro-wAVpeHGyC9UtKI3TVIATQ8uOH84FEF-twfpP8
```

⚠️ **IMPORTANTE**: Nunca compartas las claves `service_role` públicamente. Usa variables de entorno.

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

**Agregar a `.gitignore`:**
```
.env.local
.env*.local
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

## Checklist: Configuración Completa

- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] Autenticado en Supabase (`supabase login`)
- [ ] Proyecto vinculado (`supabase link --project-ref pevpefnemqvyygkrcwir`)
- [ ] `.env.local` creado con credenciales
- [ ] `.env.local` agregado a `.gitignore`
- [ ] Supabase local iniciado (`supabase start`)
- [ ] Studio local accesible (http://localhost:54323)
- [ ] Tipos TypeScript generados (`supabase gen types typescript`)
- [ ] Cliente SQL configurado (DBeaver/DataGrip/pgAdmin)

---

**Última actualización:** 2025-11-10  
**Versión:** 1.0.0  
**Proyecto:** Reserveo  
**Supabase Project ID:** pevpefnemqvyygkrcwir
