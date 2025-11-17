---
inclusion: always
---

# Gestión de Dominios y Entornos - RESERVEO

## Entornos Actuales

### 1. Desarrollo Local
- **URL**: `http://localhost:8080`
- **Uso**: Desarrollo local en máquina del desarrollador
- **Base de datos**: Supabase remoto (rlrzcfnhhvrvrxzfifeh.supabase.co)
- **Variables**: `.env` (no en Git)

### 2. Preview/Staging (Vercel)
- **URL**: `https://reserveo.vercel.app`
- **Uso**: Testing, demos, previews de features
- **Deployment**: Automático desde Git (main branch)
- **Variables**: Vercel Environment Variables (Preview)
- **Estado**: ✅ Activo

### 3. Producción Futura (VPS Propio)
- **URL**: `https://www.reserveo.app` (en proceso de adquisición)
- **Uso**: Producción final para usuarios reales
- **Infraestructura**: VPS propio (no Vercel)
- **Estado**: 🚧 En proceso de setup
- **Migración**: Pendiente desde Vercel

## Reglas Críticas para URLs

### ❌ NUNCA Hardcodear URLs

```typescript
// ❌ INCORRECTO - URL hardcodeada
const logoUrl = "https://reserveo.vercel.app/logo.png";
const apiUrl = "http://localhost:8080/api";

// ✅ CORRECTO - Usar variables de entorno
const logoUrl = `${import.meta.env.VITE_APP_URL}/logo.png`;
const apiUrl = import.meta.env.VITE_API_URL;
```

### ✅ Usar Variables de Entorno

**Archivo `.env` (local):**
```bash
VITE_APP_URL=http://localhost:8080
VITE_SUPABASE_URL=https://rlrzcfnhhvrvrxzfifeh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

**Vercel Environment Variables (preview/production):**
```bash
VITE_APP_URL=https://reserveo.vercel.app  # Preview
VITE_APP_URL=https://www.reserveo.app     # Production (futuro)
```

## Casos de Uso Específicos

### 1. Logos en Emails

**Problema**: Los emails necesitan URLs absolutas que funcionen desde cualquier cliente de correo.

**Solución Actual (Vercel)**:
```typescript
// En Edge Function o backend
const logoUrl = `${Deno.env.get('VITE_APP_URL')}/logo-email.png`;

// En template HTML
<img src="https://reserveo.vercel.app/public/logo-email.png" alt="Reserveo" />
```

**Solución Futura (VPS)**:
```typescript
// Mismo código, diferente variable
const logoUrl = `${Deno.env.get('VITE_APP_URL')}/logo-email.png`;

// En template HTML (se actualizará automáticamente)
<img src="https://www.reserveo.app/public/logo-email.png" alt="Reserveo" />
```

**Alternativa (Base64 embebido)**:
```html
<!-- No depende de dominio, siempre funciona -->
<img src="data:image/png;base64,iVBORw0KG..." alt="Reserveo" />
```

### 2. Assets Públicos (Imágenes, Archivos)

**Ubicación**: `public/` folder

**Acceso en código**:
```typescript
// ✅ CORRECTO - Ruta relativa (Vite la resuelve)
<img src="/logo-email.png" alt="Logo" />

// ✅ CORRECTO - Con variable de entorno para URLs absolutas
const absoluteUrl = `${import.meta.env.VITE_APP_URL}/logo-email.png`;
```

**En emails o contextos externos**:
```typescript
// Usar variable de entorno
const logoUrl = `${import.meta.env.VITE_APP_URL}/logo-email.png`;
```

### 3. Storage de Supabase (Fotos, Floor Plans)

**Ubicación**: Supabase Storage buckets

**Ventaja**: URLs independientes del dominio de la app

```typescript
// ✅ CORRECTO - URL de Supabase (no cambia con dominio)
const { data } = supabase.storage
  .from('incident-photos')
  .getPublicUrl(photoPath);

const photoUrl = data.publicUrl;
// Resultado: https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/incident-photos/...
```

**Recomendación**: Usar Supabase Storage para assets que necesitan URLs permanentes.

### 4. Redirects y Callbacks

**OAuth, webhooks, etc.**:
```typescript
// ✅ CORRECTO - Usar variable de entorno
const redirectUrl = `${import.meta.env.VITE_APP_URL}/auth/callback`;
const webhookUrl = `${import.meta.env.VITE_APP_URL}/api/webhook`;
```

## Migración a Producción (www.reserveo.app)

### Checklist Pre-Migración

- [ ] Adquirir dominio `reserveo.app`
- [ ] Configurar VPS (servidor, firewall, SSL)
- [ ] Configurar DNS (A records, CNAME)
- [ ] Instalar certificado SSL (Let's Encrypt)
- [ ] Configurar variables de entorno en VPS
- [ ] Migrar base de datos (si aplica) o mantener Supabase
- [ ] Actualizar `VITE_APP_URL` en variables de entorno
- [ ] Probar todos los flujos (emails, notificaciones, storage)
- [ ] Actualizar documentación y README

### Cambios Necesarios

**Variables de Entorno (VPS)**:
```bash
# Actualizar en servidor de producción
VITE_APP_URL=https://www.reserveo.app
VITE_SUPABASE_URL=https://rlrzcfnhhvrvrxzfifeh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

**Código**: ✅ NO requiere cambios si usaste variables de entorno correctamente

**Supabase**:
- Actualizar "Site URL" en Auth settings
- Actualizar "Redirect URLs" permitidas
- Verificar CORS settings

**Vercel**:
- Mantener como staging/preview
- O redirigir a nuevo dominio
- O desactivar después de migración exitosa

## Mejores Prácticas

### 1. Siempre Usar Variables de Entorno

```typescript
// ✅ CORRECTO
const appUrl = import.meta.env.VITE_APP_URL;
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ INCORRECTO
const appUrl = "https://reserveo.vercel.app";
```

### 2. Documentar Variables Requeridas

**En `.env.example`**:
```bash
# URL base de la aplicación (sin trailing slash)
VITE_APP_URL=http://localhost:8080

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
```

### 3. Validar Variables al Inicio

```typescript
// En main.tsx o config
const requiredEnvVars = [
  'VITE_APP_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### 4. Usar Rutas Relativas Cuando Sea Posible

```typescript
// ✅ CORRECTO - Ruta relativa (funciona en cualquier dominio)
<img src="/logo.png" alt="Logo" />
<a href="/dashboard">Dashboard</a>

// ❌ INCORRECTO - URL absoluta hardcodeada
<img src="https://reserveo.vercel.app/logo.png" alt="Logo" />
```

### 5. Assets Críticos en Supabase Storage

Para assets que necesitan URLs permanentes (emails, notificaciones externas):

```typescript
// Subir a Supabase Storage
await supabase.storage
  .from('public-assets')
  .upload('logo-email.png', file);

// Obtener URL pública (permanente)
const { data } = supabase.storage
  .from('public-assets')
  .getPublicUrl('logo-email.png');

// URL no depende del dominio de la app
console.log(data.publicUrl);
// https://rlrzcfnhhvrvrxzfifeh.supabase.co/storage/v1/object/public/public-assets/logo-email.png
```

## Testing en Diferentes Entornos

### Local (localhost:8080)
```bash
npm run dev
# Verifica que VITE_APP_URL=http://localhost:8080
```

### Preview (Vercel)
```bash
# Push a Git, Vercel despliega automáticamente
git push origin feature-branch
# Vercel crea preview con URL única
# Verifica variables en Vercel Dashboard
```

### Production (Futuro VPS)
```bash
# Build de producción
npm run build

# Deploy a VPS
# Configurar variables de entorno en servidor
# VITE_APP_URL=https://www.reserveo.app
```

## Troubleshooting

### Problema: Logo no se ve en emails

**Causa**: URL hardcodeada o variable incorrecta

**Solución**:
1. Verificar `VITE_APP_URL` en variables de entorno
2. Usar URL absoluta con variable: `${VITE_APP_URL}/logo.png`
3. O usar base64 embebido (no depende de dominio)

### Problema: Redirect después de OAuth falla

**Causa**: Redirect URL no coincide con dominio actual

**Solución**:
1. Actualizar `VITE_APP_URL` en variables de entorno
2. Verificar "Redirect URLs" en Supabase Auth settings
3. Añadir todos los dominios permitidos (localhost, vercel, producción)

### Problema: CORS errors en API

**Causa**: Dominio no permitido en CORS

**Solución**:
1. Actualizar CORS settings en Supabase
2. Añadir nuevo dominio a lista de orígenes permitidos
3. Verificar que `VITE_APP_URL` es correcto

## Referencias

- Variables de entorno en Vite: https://vitejs.dev/guide/env-and-mode.html
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Supabase Auth URLs: https://supabase.com/docs/guides/auth/redirect-urls
