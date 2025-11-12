# Guía de Seguridad - RESERVEO

## Variables de Entorno

### Configuración Local

El archivo `.env` contiene las credenciales de Supabase y **NO debe subirse a Git**.

**Archivo:** `.env` (local, no en Git)
```bash
VITE_SUPABASE_PROJECT_ID="rlrzcfnhhvrvrxzfifeh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
VITE_SUPABASE_URL="https://rlrzcfnhhvrvrxzfifeh.supabase.co"
```

**Plantilla:** `.env.example` (en Git, sin valores reales)
```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

### Tipos de Keys de Supabase

#### ✅ ANON KEY (Pública)
- **Ubicación:** Frontend, `.env`
- **Seguridad:** Pública por diseño
- **Uso:** Autenticación de usuarios, queries con RLS
- **Protección:** Row Level Security (RLS) en base de datos
- **Expuesta en:** Código JavaScript compilado (normal)

#### ❌ SERVICE_ROLE KEY (Privada)
- **Ubicación:** NUNCA en frontend, solo backend/serverless
- **Seguridad:** CRÍTICA - bypasea RLS
- **Uso:** Operaciones administrativas del servidor
- **Protección:** NUNCA exponerla en código cliente
- **Expuesta en:** NUNCA debe estar en Git ni frontend

### Variables en Producción (Vercel)

Las variables de entorno en Vercel están configuradas en:
- Dashboard → Settings → Environment Variables
- No se exponen en el código fuente
- Se inyectan en tiempo de build

## Arquitectura de Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:

```sql
-- Ejemplo: Solo usuarios ven sus propios datos
CREATE POLICY "Users can view their own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Admins ven todo
CREATE POLICY "Admins can view all data"
  ON table_name FOR SELECT
  USING (public.is_admin(auth.uid()));
```

### Funciones de Seguridad

```sql
-- Verificar si usuario es admin
public.is_admin(user_id UUID) → BOOLEAN

-- Verificar rol específico
public.has_role(user_id UUID, role app_role) → BOOLEAN

-- Obtener prioridad de rol
public.get_user_role_priority(user_id UUID) → INTEGER
```

### Storage Security

**Bucket:** `incident-photos`
- **Público:** NO (requiere autenticación)
- **Estructura:** `{user_id}/{incident_id}.jpg`
- **Políticas:**
  - Usuarios suben/ven solo sus fotos
  - Admins ven todas las fotos
  - Usuarios borran fotos < 24h
  - Admins borran cualquier foto

## Validaciones de Seguridad

### Upload de Archivos

```typescript
// Validación de tipo MIME
const validTypes = ['image/jpeg', 'image/png', 'image/heic'];

// Validación de tamaño (max 10MB)
const maxSize = 10 * 1024 * 1024;

// Compresión automática si > 500KB
if (fileSize > 500KB) {
  file = await compressImage(file);
}
```

### Sanitización de Inputs

```typescript
// Matrículas: solo alfanuméricos, uppercase
const sanitized = licensePlate
  .replace(/[^a-zA-Z0-9]/g, '')
  .toUpperCase();

// Validación con Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

## Checklist de Seguridad

### Antes de Commit
- [ ] `.env` NO está en Git
- [ ] `.env.example` tiene valores placeholder
- [ ] No hay contraseñas hardcoded
- [ ] No hay SERVICE_ROLE_KEY en código

### Antes de Deploy
- [ ] Variables de entorno configuradas en Vercel
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas de storage configuradas
- [ ] Validaciones de input implementadas

### Auditoría Regular
- [ ] Revisar logs de Supabase
- [ ] Verificar políticas RLS
- [ ] Actualizar dependencias
- [ ] Revisar permisos de usuarios

## Contacto de Seguridad

Si encuentras una vulnerabilidad de seguridad:
1. NO la publiques en issues públicos
2. Contacta al equipo de desarrollo directamente
3. Proporciona detalles para reproducir el problema

## Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
