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

### 4. Dominio de Email (Resend)
- **Dominio**: `noreply.reserveo.app`
- **Servicio**: Resend (plataforma de envío de emails)
- **Uso**: Envío de emails transaccionales (notificaciones, confirmaciones, enlaces de acción)
- **Tipo**: No-reply (no acepta respuestas)
- **Estado**: ✅ Verificado y activo
- **Configuración**: DNS configurado con registros SPF, DKIM y DMARC

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

### 1. Emails Transaccionales (Resend)

**Configuración Actual**:
- **Dominio verificado**: `noreply.reserveo.app`
- **Servicio**: Resend
- **From address**: `noreply@reserveo.app`
- **Edge Function**: `supabase/functions/send-notification/index.ts`
- **Uso**: Sistema completo de notificaciones por email

**Variables de Entorno Requeridas**:
```bash
# En Supabase Edge Function secrets
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Variables de entorno de la app
VITE_APP_URL=https://reserveo.vercel.app  # Preview
VITE_APP_URL=https://www.reserveo.app     # Production (futuro)
```

**Tipos de Emails Implementados** (17 tipos):

#### Waitlist (6 tipos)
1. **`waitlist_registered`** - Confirmación de registro en lista de espera
2. **`waitlist_offer`** - Oferta de plaza disponible (con tiempo límite)
   - Incluye: número de plaza, fecha de expiración
   - Botón: "Ver Oferta y Aceptar"
3. **`waitlist_reminder`** - Recordatorio de oferta pendiente
4. **`waitlist_accepted`** - Confirmación de oferta aceptada
5. **`waitlist_rejected`** - Notificación de oferta rechazada
6. **`waitlist_expired`** - Notificación de oferta expirada

#### Warnings & Blocks (3 tipos)
7. **`warning_received`** - Amonestación recibida
   - Incluye: motivo, tipo de infracción
   - Botón: "Ver Mis Amonestaciones"
8. **`user_blocked`** - Usuario bloqueado temporalmente
   - Incluye: fecha de fin del bloqueo, motivo
9. **`block_expired`** - Bloqueo expirado

#### Reservations (4 tipos)
10. **`reservation_confirmed`** - Confirmación de reserva
11. **`reservation_cancelled`** - Reserva cancelada
    - Incluye: número de plaza, fecha
    - Botón: "Ver Mis Reservas"
12. **`checkin_reminder`** - Recordatorio de check-in
13. **`checkin_success`** - Check-in exitoso

#### Incidents (3 tipos)
14. **`incident_reported`** - Incidente reportado
15. **`incident_reassignment`** - Reasignación por incidente
    - Incluye: plaza original, nueva plaza asignada
    - Botón: "Ver Nueva Plaza"
16. **`incident_confirmed`** - Incidente confirmado por admin

#### System (4 tipos)
17. **`license_plate_approved`** - Matrícula aprobada
18. **`license_plate_rejected`** - Matrícula rechazada
    - Incluye: número de matrícula, motivo de rechazo
    - Botón: "Gestionar Matrículas"
19. **`group_access_added`** - Acceso a grupo añadido
20. **`group_access_removed`** - Acceso a grupo removido

**Características de los Emails**:
- ✅ Diseño responsive (mobile-first)
- ✅ Logo de Reserveo (hosteado en `${VITE_APP_URL}/logo-email.png`)
- ✅ Gradiente de marca (purple/violet)
- ✅ Botones de acción contextuales
- ✅ Info boxes con datos relevantes
- ✅ Footer con enlaces (preferencias, dashboard)
- ✅ Headers anti-spam (List-Unsubscribe, Reply-To)
- ✅ Tags para tracking (category, type, priority)
- ✅ Compatible con todos los clientes de email

**Preferencias de Usuario (GDPR Compliant)**:
Los usuarios pueden controlar qué emails reciben desde `/profile/preferences`:
- Master switch: `email_enabled`
- Críticas: `email_waitlist_offers`, `email_warnings`, `email_blocks`
- Importantes: `email_reservation_cancelled`, `email_incident_reassignment`, `email_license_plate_rejected`

**Configuración en Edge Function**:
```typescript
// En supabase/functions/send-notification/index.ts
const RESEND_FROM_EMAIL = 'noreply@noreply.reserveo.app'
const RESEND_FROM_NAME = 'Reserveo'

// Envío con mejores prácticas anti-spam
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
    to: [user_email],
    subject: title,
    html: emailHtml,
    reply_to: RESEND_FROM_EMAIL,
    headers: {
      'X-Entity-Ref-ID': notification_id,
      'List-Unsubscribe': `<https://reserveo.app/profile/preferences>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags: [
      { name: 'category', value: category },
      { name: 'type', value: type },
      { name: 'priority', value: priority }
    ],
  }),
})
```

**Logos en Emails**:

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

**Mejores Prácticas para Emails**:
- ✅ Usar `noreply@reserveo.app` como remitente
- ✅ Incluir nombre descriptivo: `Reserveo <noreply@reserveo.app>`
- ✅ No usar `localhost` en URLs de emails
- ✅ Usar URLs absolutas con `VITE_APP_URL`
- ✅ Incluir enlaces de acción con dominio correcto
- ✅ Probar emails en diferentes clientes (Gmail, Outlook, etc.)

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
- [ ] Verificar que emails siguen funcionando con `noreply@reserveo.app`
- [ ] Actualizar enlaces en templates de email a nuevo dominio
- [ ] Probar todos los flujos (emails, notificaciones, storage)
- [ ] Actualizar documentación y README

### Cambios Necesarios

**Variables de Entorno (VPS)**:
```bash
# Actualizar en servidor de producción
VITE_APP_URL=https://www.reserveo.app
VITE_SUPABASE_URL=https://rlrzcfnhhvrvrxzfifeh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# Email (Resend) - NO cambiar, ya está configurado
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@reserveo.app
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

# Email (Resend) - Para Edge Functions
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@reserveo.app
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

## Resumen de Dominios

| Dominio | Propósito | Estado | Servicio |
|---------|-----------|--------|----------|
| `localhost:8080` | Desarrollo local | ✅ Activo | Local |
| `reserveo.vercel.app` | Preview/Staging | ✅ Activo | Vercel |
| `www.reserveo.app` | Producción final | 🚧 En proceso | VPS propio |
| `noreply.reserveo.app` | Emails transaccionales | ✅ Verificado | Resend |

## Referencias

- Variables de entorno en Vite: https://vitejs.dev/guide/env-and-mode.html
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Supabase Auth URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Resend Documentation: https://resend.com/docs
- Resend Domain Verification: https://resend.com/docs/dashboard/domains/introduction
