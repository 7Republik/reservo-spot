---
inclusion: always
---

# RESERVEO - Security Guidelines

## Siempre háblame en español

## Variables de Entorno

### ⚠️ REGLA CRÍTICA: .env NUNCA en Git

**Archivo `.env`:**
- ❌ NUNCA debe subirse a Git
- ✅ Debe estar en `.gitignore`
- ✅ Contiene credenciales locales
- ✅ Cada desarrollador tiene su propia copia

**Archivo `.env.example`:**
- ✅ SÍ debe estar en Git
- ✅ Contiene plantilla sin valores reales
- ✅ Documenta qué variables se necesitan

### Tipos de Keys de Supabase

#### ANON KEY (Pública) ✅
```bash
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
```
- **Seguridad:** Pública por diseño
- **Ubicación:** Frontend, código JavaScript
- **Protección:** Row Level Security (RLS)
- **Expuesta:** Sí, en el bundle compilado (normal)

#### SERVICE_ROLE KEY (Privada) ❌
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # NUNCA en frontend
```
- **Seguridad:** CRÍTICA - bypasea RLS
- **Ubicación:** SOLO backend/serverless
- **Protección:** NUNCA exponerla
- **Expuesta:** NUNCA debe estar en Git ni frontend

### Variables en Producción

**Vercel Environment Variables:**
- Dashboard → Settings → Environment Variables
- No se exponen en código fuente
- Se inyectan en tiempo de build
- Diferentes por entorno (dev/preview/production)

## Row Level Security (RLS)

### Principios Fundamentales

1. **Todas las tablas DEBEN tener RLS habilitado**
2. **La seguridad está en el servidor, no en ocultar keys**
3. **Usuarios solo ven/modifican sus propios datos**
4. **Admins tienen acceso completo vía `is_admin(auth.uid())`**
5. **Denegar acceso anónimo explícitamente**

### Patrón Estándar de Políticas

```sql
-- Habilitar RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Denegar anónimos
CREATE POLICY "Deny anon access"
  ON table_name FOR SELECT TO anon
  USING (false);

-- Usuarios ven sus datos
CREATE POLICY "Users view own data"
  ON table_name FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins ven todo
CREATE POLICY "Admins view all"
  ON table_name FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Usuarios modifican sus datos
CREATE POLICY "Users modify own data"
  ON table_name FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins modifican todo
CREATE POLICY "Admins modify all"
  ON table_name FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
```

## Storage Security

### Bucket: incident-photos

**Configuración:**
- Público: NO (requiere autenticación)
- Estructura: `{user_id}/{incident_id}.jpg`
- Tamaño máximo: 10 MB
- Tipos permitidos: JPEG, PNG, HEIC

**Políticas RLS:**
```sql
-- Usuarios suben sus fotos
CREATE POLICY "Users upload own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'incident-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Usuarios ven sus fotos
CREATE POLICY "Users view own photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'incident-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins ven todas
CREATE POLICY "Admins view all photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'incident-photos' AND
    public.is_admin(auth.uid())
  );
```

## Validación de Inputs

### Frontend Validation

**Siempre validar con Zod:**
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  licensePlate: z.string().min(4).max(15),
});
```

### Sanitización

**Matrículas:**
```typescript
const sanitizeLicensePlate = (plate: string) => {
  return plate
    .replace(/[^a-zA-Z0-9]/g, '') // Solo alfanuméricos
    .toUpperCase()
    .trim();
};
```

**Archivos:**
```typescript
// Validar tipo MIME
const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
if (!validTypes.includes(file.type)) {
  throw new Error('Tipo de archivo no válido');
}

// Validar tamaño
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new Error('Archivo demasiado grande');
}
```

## Protección contra Vulnerabilidades

### ✅ Protecciones Implementadas

1. **SQL Injection:** Supabase client usa queries parametrizadas
2. **XSS:** React escapa automáticamente el contenido
3. **CSRF:** Supabase maneja tokens automáticamente
4. **Unauthorized Access:** RLS en todas las tablas
5. **File Upload:** Validación de tipo y tamaño

### ❌ Nunca Hacer

```typescript
// ❌ NUNCA: Queries raw con concatenación
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ❌ NUNCA: dangerouslySetInnerHTML sin sanitizar
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ NUNCA: eval() o Function()
eval(userInput);

// ❌ NUNCA: SERVICE_ROLE_KEY en frontend
const supabase = createClient(url, SERVICE_ROLE_KEY); // ❌

// ❌ NUNCA: Hardcoded passwords (excepto dev temporal)
if (password === "12345678") { ... }
```

## Funciones de Seguridad

### Security Definer Functions

**Uso correcto:**
```sql
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER  -- Ejecuta con permisos del owner
SET search_path = public  -- Previene search_path attacks
AS $
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$;
```

**Funciones disponibles:**
- `is_admin(user_id)` - Verifica si es admin
- `has_role(user_id, role)` - Verifica rol específico
- `get_user_role_priority(user_id)` - Obtiene prioridad (1-5)
- `is_user_active(user_id)` - Verifica si no está bloqueado

## Error Handling

### Códigos de Error Comunes

```typescript
try {
  const { data, error } = await supabase.from('table').insert(values);
  
  if (error) {
    switch (error.code) {
      case '23505': // Unique constraint
        toast.error('El registro ya existe');
        break;
      case '23503': // Foreign key violation
        toast.error('Referencia inválida');
        break;
      case '42501': // Insufficient privilege (RLS)
        toast.error('No tienes permisos');
        break;
      case 'P0001': // Raised exception
        toast.error(error.message);
        break;
      default:
        toast.error('Error inesperado');
    }
  }
} catch (err) {
  console.error('Unexpected error:', err);
  toast.error('Error inesperado');
}
```

## Checklist de Seguridad

### Antes de Commit
- [ ] `.env` NO está en Git
- [ ] `.env.example` tiene valores placeholder
- [ ] No hay contraseñas hardcoded (excepto dev temporal)
- [ ] No hay SERVICE_ROLE_KEY en código
- [ ] Validaciones de input implementadas

### Antes de Deploy
- [ ] Variables de entorno en Vercel configuradas
- [ ] RLS habilitado en todas las tablas nuevas
- [ ] Políticas de storage configuradas
- [ ] Tipos regenerados: `supabase gen types typescript --linked`

### Nueva Tabla
- [ ] `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- [ ] Política para denegar anónimos
- [ ] Política para usuarios (ver sus datos)
- [ ] Política para admins (ver todo)
- [ ] Políticas de INSERT/UPDATE/DELETE según necesidad

### Nuevo Storage Bucket
- [ ] Crear bucket manualmente en Dashboard
- [ ] Configurar público/privado según necesidad
- [ ] Crear políticas RLS en migración
- [ ] Validar tipos MIME permitidos
- [ ] Configurar límite de tamaño

## Auditoría y Logging

### Tablas de Auditoría

**Existentes:**
- `reservation_cancellation_log` - Cancelaciones automáticas
- `incident_reports` - Reportes de incidentes
- `user_warnings` - Advertencias a usuarios

**Patrón para nuevas:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Referencias

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- Documentación completa: `docs/SECURITY.md`
