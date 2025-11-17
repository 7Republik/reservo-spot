import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@noreply.reserveo.app'
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Reserveo'

serve(async (req) => {
  try {
    // Parsear datos recibidos desde la función SQL
    const {
      notification_id,
      user_email,
      user_name,
      type,
      title,
      message,
      priority,
      category,
      data,
      action_url
    } = await req.json()

    // Validar parámetros requeridos
    if (!notification_id || !user_email || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validar API key de Resend
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing notification ${notification_id} for ${user_email}`)

    // Generar HTML del email
    const emailHtml = generateEmailHtml(type, title, message, data, user_name, action_url)

    // Enviar email con Resend (con mejores prácticas anti-spam)
    const resendResponse = await fetch('https://api.resend.com/emails', {
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
        // Mejores prácticas anti-spam
        reply_to: RESEND_FROM_EMAIL,
        headers: {
          'X-Entity-Ref-ID': notification_id,
          'List-Unsubscribe': `<https://reserveo.app/profile/preferences>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        // Tags para tracking y organización
        tags: [
          { name: 'category', value: category || 'notification' },
          { name: 'type', value: type },
          { name: 'priority', value: priority || 'normal' }
        ],
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      console.error(`Resend API error for notification ${notification_id}:`, error)
      throw new Error(`Resend API error: ${error}`)
    }

    const resendData = await resendResponse.json()
    console.log(`Email sent successfully for notification ${notification_id}:`, resendData.id)

    // Actualizar notificación como enviada
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabaseClient
      .from('notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', notification_id)

    if (updateError) {
      console.error(`Error updating notification ${notification_id}:`, updateError)
      // No lanzar error, el email ya se envió
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: resendData.id,
        notification_id 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================
// FUNCIÓN: generateEmailHtml
// Propósito: Generar HTML del email según tipo de notificación
// =====================================================

function generateEmailHtml(
  type: string,
  title: string,
  message: string,
  data: any,
  userName: string,
  actionUrl?: string
): string {
  // Logo hosteado (mejor para producción)
  // Ventajas: Emails más ligeros, fácil de actualizar, mejor deliverability
  // Usa variable de entorno para funcionar en local y producción
  const baseUrl = Deno.env.get('VITE_APP_URL') || Deno.env.get('APP_URL') || 'https://www.reserveo.app'
  const logoUrl = `${baseUrl}/logo-email.png`
  
  // Fallback a base64 si prefieres (para testing o si no tienes logo hosteado aún)
  // const logoBase64 = 'data:image/svg+xml;base64,...'
  
  const baseStyles = `
    <style>
      /* Reset básico para compatibilidad con clientes de email */
      body, table, td, a { 
        -webkit-text-size-adjust: 100%; 
        -ms-text-size-adjust: 100%; 
      }
      table, td { 
        mso-table-lspace: 0pt; 
        mso-table-rspace: 0pt; 
      }
      img { 
        -ms-interpolation-mode: bicubic; 
        border: 0; 
        height: auto; 
        line-height: 100%; 
        outline: none; 
        text-decoration: none; 
      }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* Contenedor principal */
      .email-wrapper {
        width: 100%;
        background-color: #f5f5f5;
        padding: 20px 0;
      }
      
      .container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      /* Header con logo */
      .header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 30px; 
        text-align: center;
      }
      
      .logo-container {
        margin-bottom: 15px;
      }
      
      .logo {
        width: 48px;
        height: 48px;
        display: inline-block;
      }
      
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      
      /* Contenido */
      .content { 
        padding: 40px 30px; 
      }
      
      .content h2 {
        color: #1a1a1a;
        font-size: 22px;
        margin: 0 0 20px 0;
        font-weight: 600;
      }
      
      .content p {
        color: #4a5568;
        font-size: 16px;
        line-height: 1.8;
        margin: 0 0 15px 0;
      }
      
      .greeting {
        font-weight: 500;
        color: #2d3748;
      }
      
      /* Info boxes */
      .info-box {
        background: #f7fafc;
        border-left: 4px solid #667eea;
        padding: 15px 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      
      .info-box strong {
        color: #2d3748;
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
      }
      
      /* Botón de acción */
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      
      .button { 
        display: inline-block; 
        padding: 14px 32px; 
        background: #667eea; 
        color: white !important; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: 600;
        font-size: 16px;
        transition: background 0.3s;
      }
      
      .button:hover {
        background: #5568d3;
      }
      
      /* Footer */
      .footer { 
        text-align: center; 
        padding: 30px; 
        background: #f7fafc;
        color: #718096; 
        font-size: 14px; 
        line-height: 1.6;
      }
      
      .footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
      }
      
      .footer a:hover {
        text-decoration: underline;
      }
      
      .footer-links {
        margin: 15px 0;
      }
      
      .footer-links a {
        margin: 0 10px;
      }
      
      .copyright {
        margin-top: 20px;
        color: #a0aec0;
        font-size: 12px;
      }
      
      /* Responsive */
      @media only screen and (max-width: 600px) {
        .container {
          border-radius: 0 !important;
        }
        .content {
          padding: 30px 20px !important;
        }
        .header {
          padding: 25px 20px !important;
        }
        .button {
          padding: 12px 24px !important;
          font-size: 14px !important;
        }
      }
    </style>
  `

  let additionalInfo = ''
  let actionButton = ''

  // Personalizar según tipo de notificación
  switch (type) {
    case 'waitlist_offer':
      if (data?.spot_number) {
        additionalInfo += `
          <div class="info-box">
            <strong>Plaza asignada:</strong>
            ${data.spot_number}
          </div>
        `
      }
      if (data?.expires_at) {
        const expiresAt = new Date(data.expires_at).toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'short'
        })
        additionalInfo += `
          <div class="info-box">
            <strong>⏰ Esta oferta expira:</strong>
            ${expiresAt}
          </div>
        `
      }
      actionButton = `<a href="${baseUrl}/waitlist" class="button">Ver Oferta y Aceptar</a>`
      break
    
    case 'warning_received':
      if (data?.reason) {
        additionalInfo += `
          <div class="info-box">
            <strong>Motivo:</strong>
            ${data.reason}
          </div>
        `
      }
      if (data?.infraction_type) {
        additionalInfo += `
          <div class="info-box">
            <strong>Tipo de infracción:</strong>
            ${data.infraction_type}
          </div>
        `
      }
      actionButton = `<a href="${baseUrl}/profile" class="button">Ver Mis Amonestaciones</a>`
      break
    
    case 'user_blocked':
      if (data?.blocked_until) {
        const blockedUntil = new Date(data.blocked_until).toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'short'
        })
        additionalInfo += `
          <div class="info-box">
            <strong>🚫 Bloqueado hasta:</strong>
            ${blockedUntil}
          </div>
        `
      }
      if (data?.reason) {
        additionalInfo += `
          <div class="info-box">
            <strong>Motivo del bloqueo:</strong>
            ${data.reason}
          </div>
        `
      }
      break
    
    case 'reservation_cancelled':
      if (data?.spot_number && data?.reservation_date) {
        const date = new Date(data.reservation_date).toLocaleDateString('es-ES', {
          dateStyle: 'full'
        })
        additionalInfo += `
          <div class="info-box">
            <strong>Reserva cancelada:</strong>
            Plaza ${data.spot_number} - ${date}
          </div>
        `
      }
      actionButton = `<a href="${baseUrl}/dashboard" class="button">Ver Mis Reservas</a>`
      break
    
    case 'incident_reassignment':
      if (data?.old_spot_number && data?.new_spot_number) {
        additionalInfo += `
          <div class="info-box">
            <strong>Plaza original:</strong> ${data.old_spot_number}<br>
            <strong>Nueva plaza asignada:</strong> ${data.new_spot_number}
          </div>
        `
      }
      actionButton = `<a href="${baseUrl}/dashboard" class="button">Ver Nueva Plaza</a>`
      break
    
    case 'license_plate_rejected':
      if (data?.plate_number) {
        additionalInfo += `
          <div class="info-box">
            <strong>Matrícula rechazada:</strong>
            ${data.plate_number}
          </div>
        `
      }
      if (data?.rejection_reason) {
        additionalInfo += `
          <div class="info-box">
            <strong>Motivo:</strong>
            ${data.rejection_reason}
          </div>
        `
      }
      actionButton = `<a href="${baseUrl}/profile/license-plates" class="button">Gestionar Matrículas</a>`
      break
    
    default:
      // Botón genérico si hay action_url
      if (actionUrl) {
        actionButton = `<a href="${actionUrl}" class="button">Ver Detalles</a>`
      } else {
        actionButton = `<a href="${baseUrl}/dashboard" class="button">Ir al Dashboard</a>`
      }
  }

  return `
    <!DOCTYPE html>
    <html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
      <title>${title}</title>
      ${baseStyles}
      <!--[if mso]>
      <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body>
      <div class="email-wrapper">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td align="center">
              <div class="container">
                <!-- Header con logo -->
                <div class="header">
                  <div class="logo-container">
                    <img src="${logoUrl}" alt="Reserveo Logo" class="logo" width="48" height="48">
                  </div>
                  <h1>Reserveo</h1>
                </div>
                
                <!-- Contenido principal -->
                <div class="content">
                  <h2>${title}</h2>
                  <p class="greeting">Hola ${userName || 'Usuario'},</p>
                  <p>${message}</p>
                  ${additionalInfo}
                  ${actionButton ? `
                    <div class="button-container">
                      ${actionButton}
                    </div>
                  ` : ''}
                </div>
                
                <!-- Footer -->
                <div class="footer">
                  <p>Este es un email automático del sistema Reserveo</p>
                  <div class="footer-links">
                    <a href="${baseUrl}/profile/preferences">Gestionar preferencias</a>
                    <span style="color: #cbd5e0;">|</span>
                    <a href="${baseUrl}/dashboard">Ir al Dashboard</a>
                  </div>
                  <p class="copyright">
                    © ${new Date().getFullYear()} Reserveo. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `
}
