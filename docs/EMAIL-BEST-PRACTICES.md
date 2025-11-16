# Mejores Prácticas para Emails - RESERVEO

## ✅ Mejoras Implementadas

### 1. Logo Embebido
- **Logo en base64** incluido en el header del email
- Tamaño optimizado (48x48px) para carga rápida
- Compatible con todos los clientes de email
- **Cómo actualizar el logo:**
  ```typescript
  // En send-notification/index.ts, línea ~150
  const logoBase64 = 'data:image/svg+xml;base64,...'
  
  // Para convertir tu logo a base64:
  // 1. Optimiza tu logo a 48x48px
  // 2. Usa: https://base64.guru/converter/encode/image
  // 3. Reemplaza el valor de logoBase64
  ```

### 2. HTML Mejorado
- **Estructura de tabla** para compatibilidad con Outlook
- **Meta tags** para prevenir reformateo en iOS
- **Estilos inline** para máxima compatibilidad
- **Responsive design** con media queries
- **Compatibilidad con modo oscuro** (respeta preferencias del usuario)

### 3. Headers Anti-Spam
```typescript
headers: {
  'X-Entity-Ref-ID': notification_id,
  'List-Unsubscribe': '<https://reserveo.app/profile/preferences>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
}
```

- **List-Unsubscribe**: Botón de "Unsubscribe" en Gmail/Outlook
- **X-Entity-Ref-ID**: Tracking único por notificación
- **Reply-To**: Email válido para respuestas

### 4. Tags de Organización
```typescript
tags: [
  { name: 'category', value: 'notification' },
  { name: 'type', value: 'waitlist_offer' },
  { name: 'priority', value: 'high' }
]
```

Permite:
- Filtrar emails en Resend Dashboard
- Analizar tasas de apertura por tipo
- Debugging más fácil

## 🔒 Configuración DNS Requerida (CRÍTICO)

Para evitar que tus emails caigan en spam, **DEBES configurar estos registros DNS**:

### SPF (Sender Policy Framework)
Verifica que el servidor está autorizado para enviar emails desde tu dominio.

```dns
Tipo: TXT
Nombre: @
Valor: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

### DKIM (DomainKeys Identified Mail)
Firma digital que verifica que el email no fue modificado.

**Resend te proporciona estos valores automáticamente:**
1. Ve a: https://resend.com/domains
2. Añade tu dominio: `reserveo.app`
3. Copia los registros DKIM que te dan
4. Añádelos a tu DNS

Ejemplo:
```dns
Tipo: TXT
Nombre: resend._domainkey
Valor: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
TTL: 3600
```

### DMARC (Domain-based Message Authentication)
Política de autenticación y reportes.

```dns
Tipo: TXT
Nombre: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@reserveo.app; pct=100; adkim=s; aspf=s
TTL: 3600
```

**Explicación:**
- `p=quarantine`: Emails no autenticados van a spam
- `rua=mailto:dmarc@reserveo.app`: Reportes de fallos
- `pct=100`: Aplicar política al 100% de emails
- `adkim=s`: DKIM estricto
- `aspf=s`: SPF estricto

### Verificar Configuración

**Herramientas gratuitas:**
- https://mxtoolbox.com/spf.aspx
- https://mxtoolbox.com/dkim.aspx
- https://mxtoolbox.com/dmarc.aspx
- https://www.mail-tester.com/ (envía un email de prueba)

## 📧 Configuración de Resend

### 1. Dominio Verificado
```bash
# En Resend Dashboard
1. Añade tu dominio: reserveo.app
2. Verifica los registros DNS
3. Espera a que el estado sea "Verified" (puede tardar 24-48h)
```

### 2. Variables de Entorno
```bash
# .env (local)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@reserveo.app
RESEND_FROM_NAME=Reserveo

# Supabase Edge Function Secrets
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RESEND_FROM_EMAIL=noreply@reserveo.app
supabase secrets set RESEND_FROM_NAME=Reserveo
```

### 3. Email de Remitente
**Mejores prácticas:**
- ✅ `noreply@reserveo.app` - Claro que es automático
- ✅ `notifications@reserveo.app` - Específico
- ✅ `parking@reserveo.app` - Temático
- ❌ `no-reply@noreply.reserveo.app` - Redundante
- ❌ `admin@reserveo.app` - Confuso (parece personal)

## 🎯 Mejores Prácticas de Contenido

### 1. Asunto del Email
```typescript
// ✅ BUENO - Claro y específico
"Plaza A-15 disponible en lista de espera"
"Amonestación recibida por ocupación indebida"
"Tu reserva para mañana ha sido cancelada"

// ❌ MALO - Genérico o spam-like
"¡IMPORTANTE! Acción requerida"
"Haz clic aquí ahora"
"Oferta especial para ti"
```

### 2. Texto del Email
- **Personalizar** con nombre del usuario
- **Ser específico** sobre la acción requerida
- **Incluir contexto** (fecha, plaza, motivo)
- **Evitar palabras spam**: "gratis", "urgente", "haz clic", "oferta"
- **Usar lenguaje profesional** pero cercano

### 3. Botones de Acción
```html
<!-- ✅ BUENO - Texto descriptivo -->
<a href="..." class="button">Ver Oferta y Aceptar</a>
<a href="..." class="button">Ver Mis Amonestaciones</a>

<!-- ❌ MALO - Texto genérico -->
<a href="..." class="button">Haz clic aquí</a>
<a href="..." class="button">Ver más</a>
```

### 4. Footer Obligatorio
- **Link de unsubscribe** (requerido por ley)
- **Dirección física** de la empresa (opcional pero recomendado)
- **Copyright** y año actual
- **Link a preferencias** de notificaciones

## 📊 Monitoreo y Métricas

### Resend Dashboard
Monitorea estas métricas:
- **Delivery Rate**: Debe ser >95%
- **Bounce Rate**: Debe ser <5%
- **Spam Complaints**: Debe ser <0.1%
- **Open Rate**: Típicamente 20-40% para transaccionales

### Alertas a Configurar
```typescript
// En Resend Dashboard → Webhooks
{
  "events": [
    "email.bounced",
    "email.complained",
    "email.delivery_delayed"
  ],
  "url": "https://your-project.supabase.co/functions/v1/email-webhook"
}
```

## 🚨 Señales de Alerta

**Si tus emails caen en spam:**
1. ✅ Verifica registros DNS (SPF, DKIM, DMARC)
2. ✅ Revisa contenido (evita palabras spam)
3. ✅ Verifica dominio verificado en Resend
4. ✅ Revisa bounce rate (emails inválidos)
5. ✅ Usa mail-tester.com para análisis

**Si bounce rate es alto:**
1. ✅ Valida emails antes de enviar
2. ✅ Limpia lista de emails inválidos
3. ✅ Implementa double opt-in (opcional)

## 🔄 Mantenimiento

### Cada Mes
- [ ] Revisar métricas en Resend Dashboard
- [ ] Verificar que DNS sigue configurado
- [ ] Revisar quejas de spam
- [ ] Actualizar lista de emails bloqueados

### Cada Trimestre
- [ ] Revisar contenido de emails
- [ ] Actualizar diseño si es necesario
- [ ] Verificar compatibilidad con nuevos clientes
- [ ] Revisar tasas de conversión (clicks en botones)

## 📚 Referencias

- [Resend Best Practices](https://resend.com/docs/knowledge-base/best-practices)
- [Email on Acid - Spam Testing](https://www.emailonacid.com/blog/article/email-deliverability/spam-testing-for-email-marketers/)
- [DMARC.org](https://dmarc.org/)
- [Can I Email](https://www.caniemail.com/) - Compatibilidad CSS/HTML

## 🎨 Personalización del Logo

### Opción 1: Logo SVG en Base64 (Actual)
```typescript
// Ventajas: Carga rápida, escalable, sin dependencias
// Desventajas: Limitado a SVG simple

const logoBase64 = 'data:image/svg+xml;base64,...'
```

### Opción 2: Logo PNG en Base64
```typescript
// Ventajas: Soporta imágenes complejas
// Desventajas: Tamaño de archivo mayor

const logoBase64 = 'data:image/png;base64,...'
```

### Opción 3: Logo Hosteado (✅ IMPLEMENTADO - Recomendado)
```typescript
// Ventajas: Menor tamaño de email, fácil de actualizar, mejor deliverability
// Desventajas: Requiere hosting público (ya configurado con Vercel)

const logoUrl = 'https://reserveo.app/logo-email.png'

// En el HTML:
<img src="${logoUrl}" alt="Reserveo Logo" width="64" height="64">
```

**Pasos para configurar tu logo:**
1. Optimizar logo a 64x64px (< 10KB)
2. Colocar en `public/logo-email.png`
3. Desplegar a Vercel
4. Verificar: `https://reserveo.app/logo-email.png`

**Ver guía completa:** `docs/LOGO-EMAIL-SETUP.md`

**Recomendación:** Usa logo hosteado en producción para emails más ligeros.

## ✅ Checklist de Implementación

### Antes de Producción
- [ ] Configurar registros DNS (SPF, DKIM, DMARC)
- [ ] Verificar dominio en Resend
- [ ] Actualizar logo con el real de Reserveo
- [ ] Probar emails en mail-tester.com (score >8/10)
- [ ] Probar en diferentes clientes (Gmail, Outlook, Apple Mail)
- [ ] Configurar webhooks de Resend
- [ ] Documentar proceso de unsubscribe

### Después de Lanzamiento
- [ ] Monitorear métricas diarias (primera semana)
- [ ] Revisar quejas de spam
- [ ] Ajustar contenido si bounce rate >5%
- [ ] Configurar alertas automáticas
