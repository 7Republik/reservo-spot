# Checklist de Configuración de Emails - RESERVEO

## 📋 Pasos para Implementar

### 1. Configurar Dominio en Resend (30 min)

- [ ] Crear cuenta en [Resend](https://resend.com)
- [ ] Añadir dominio `reserveo.app` en Dashboard
- [ ] Copiar registros DNS proporcionados por Resend
- [ ] Ir a tu proveedor de DNS (Vercel, Cloudflare, etc.)
- [ ] Añadir registros DNS:
  - [ ] SPF: `v=spf1 include:_spf.resend.com ~all`
  - [ ] DKIM: (valores proporcionados por Resend)
  - [ ] DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@reserveo.app`
- [ ] Esperar verificación (puede tardar 24-48h)
- [ ] Verificar estado en Resend Dashboard (debe decir "Verified")

### 2. Configurar Variables de Entorno (5 min)

**En Supabase Dashboard:**
- [ ] Ir a: Project Settings → Edge Functions → Secrets
- [ ] Añadir secrets:
  ```bash
  RESEND_API_KEY=re_xxx  # Obtener de Resend Dashboard
  RESEND_FROM_EMAIL=noreply@reserveo.app
  RESEND_FROM_NAME=Reserveo
  ```

**En local (.env):**
- [ ] Añadir las mismas variables para testing local

### 3. Personalizar Logo (10 min) - ✅ Ya configurado para logo hosteado

**Logo Hosteado (Implementado):**
- [ ] Optimizar tu logo a 64x64px (< 10KB)
  - Usar: https://tinypng.com/ o https://squoosh.app/
- [ ] Guardar como: `public/logo-email.png`
- [ ] Commit y push:
  ```bash
  git add public/logo-email.png
  git commit -m "feat: add email logo"
  git push
  ```
- [ ] Vercel desplegará automáticamente
- [ ] Verificar URL: `https://reserveo.app/logo-email.png`

**El código ya está configurado para usar logo hosteado** ✅

**Ver guía detallada:** `docs/LOGO-EMAIL-SETUP.md`

### 4. Desplegar Edge Function (2 min)

```bash
# Desplegar función actualizada
supabase functions deploy send-notification

# Verificar que se desplegó correctamente
supabase functions list
```

### 5. Probar Emails (15 min)

**Test 1: Email de prueba manual**
```bash
# Desde Supabase SQL Editor
SELECT send_notification_email(
  'tu-email@gmail.com',
  'Tu Nombre',
  'waitlist_offer',
  'Plaza A-15 disponible',
  'Tienes una plaza disponible en la lista de espera',
  'high',
  'waitlist',
  '{"spot_number": "A-15", "expires_at": "2025-11-17T21:00:00Z"}'::jsonb,
  'https://reserveo.app/waitlist'
);
```

**Test 2: Verificar en mail-tester.com**
- [ ] Ir a: https://www.mail-tester.com/
- [ ] Copiar el email de prueba que te dan
- [ ] Enviar un email de prueba a ese email
- [ ] Ver el score (debe ser >8/10)
- [ ] Revisar recomendaciones si el score es bajo

**Test 3: Probar en diferentes clientes**
- [ ] Gmail (web)
- [ ] Gmail (móvil)
- [ ] Outlook (web)
- [ ] Apple Mail (si tienes Mac/iPhone)

### 6. Verificar Configuración DNS (5 min)

**Herramientas de verificación:**
- [ ] SPF: https://mxtoolbox.com/spf.aspx
- [ ] DKIM: https://mxtoolbox.com/dkim.aspx
- [ ] DMARC: https://mxtoolbox.com/dmarc.aspx

**Todos deben mostrar "PASS" o "Valid"**

### 7. Configurar Webhooks (Opcional, 10 min)

**En Resend Dashboard:**
- [ ] Ir a: Webhooks → Add Webhook
- [ ] URL: `https://[tu-proyecto].supabase.co/functions/v1/email-webhook`
- [ ] Eventos a escuchar:
  - [ ] `email.bounced`
  - [ ] `email.complained`
  - [ ] `email.delivery_delayed`
- [ ] Guardar y copiar signing secret
- [ ] Crear Edge Function para manejar webhooks (opcional)

### 8. Monitoreo Inicial (Primera Semana)

**Revisar diariamente:**
- [ ] Resend Dashboard → Analytics
  - [ ] Delivery Rate (debe ser >95%)
  - [ ] Bounce Rate (debe ser <5%)
  - [ ] Spam Complaints (debe ser <0.1%)
- [ ] Supabase Dashboard → Edge Functions → Logs
  - [ ] Verificar que no hay errores
  - [ ] Revisar tiempos de ejecución

**Configurar alertas:**
- [ ] Alerta si Bounce Rate >5%
- [ ] Alerta si Edge Function falla >10 veces/hora
- [ ] Alerta si Delivery Rate <90%

---

## ✅ Verificación Final

Antes de considerar completo:

- [ ] Dominio verificado en Resend (estado: "Verified")
- [ ] Registros DNS configurados (SPF, DKIM, DMARC)
- [ ] Variables de entorno configuradas en Supabase
- [ ] Logo personalizado (base64 o URL)
- [ ] Edge Function desplegada
- [ ] Email de prueba enviado y recibido
- [ ] Score en mail-tester.com >8/10
- [ ] Emails se ven bien en Gmail, Outlook, Apple Mail
- [ ] Botón "Unsubscribe" visible en Gmail
- [ ] Links funcionan correctamente
- [ ] Monitoreo configurado

---

## 🚨 Troubleshooting Común

### Email no llega
1. ✅ Verificar que dominio está "Verified" en Resend
2. ✅ Verificar registros DNS con mxtoolbox.com
3. ✅ Revisar logs de Edge Function en Supabase
4. ✅ Verificar que RESEND_API_KEY es correcta
5. ✅ Revisar spam folder del destinatario

### Email va a spam
1. ✅ Verificar registros DNS (SPF, DKIM, DMARC)
2. ✅ Usar mail-tester.com para análisis
3. ✅ Revisar contenido (evitar palabras spam)
4. ✅ Verificar que "From" email es del dominio verificado
5. ✅ Añadir link de unsubscribe visible

### Logo no se ve
1. ✅ Verificar que Data URI es válido
2. ✅ Verificar tamaño del logo (<50KB)
3. ✅ Si usas URL, verificar que es accesible públicamente
4. ✅ Probar en diferentes clientes de email

### Bounce Rate alto
1. ✅ Validar emails antes de enviar
2. ✅ Limpiar lista de emails inválidos
3. ✅ Implementar double opt-in (opcional)
4. ✅ Revisar logs de Resend para ver motivos

---

## 📚 Recursos

**Documentación:**
- [EMAIL-BEST-PRACTICES.md](./EMAIL-BEST-PRACTICES.md) - Guía completa
- [email-template-example.html](./email-template-example.html) - Ejemplo visual
- [NOTIFICATIONS-SYSTEM.md](./NOTIFICATIONS-SYSTEM.md) - Sistema completo

**Herramientas:**
- [Resend Dashboard](https://resend.com/dashboard)
- [MX Toolbox](https://mxtoolbox.com/)
- [Mail Tester](https://www.mail-tester.com/)
- [Can I Email](https://www.caniemail.com/)

**Scripts:**
- `scripts/convert-logo-to-base64.js` - Convertir logo

---

## ⏱️ Tiempo Estimado Total

- **Configuración inicial:** 1 hora
- **Testing y ajustes:** 30 minutos
- **Monitoreo primera semana:** 15 min/día

**Total:** ~2 horas para setup completo

---

## 🎯 Próximos Pasos

Después de completar este checklist:

1. **Monitorear métricas** durante la primera semana
2. **Ajustar contenido** si bounce rate es alto
3. **Optimizar diseño** basado en feedback de usuarios
4. **Configurar webhooks** para tracking avanzado
5. **Implementar A/B testing** de asuntos (opcional)

---

## ✨ ¡Listo!

Una vez completado este checklist, tu sistema de emails estará:
- ✅ Configurado profesionalmente
- ✅ Optimizado para evitar spam
- ✅ Monitoreado y con alertas
- ✅ Listo para producción

**¿Dudas?** Consulta `docs/EMAIL-BEST-PRACTICES.md` o `docs/NOTIFICATIONS-TROUBLESHOOTING.md`
