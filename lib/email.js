import * as Brevo from '@getbrevo/brevo'

// Lazy initialization - only create client when needed
let brevoClient = null

function getBrevoClient() {
  if (!brevoClient && process.env.BREVO_API_KEY) {
    brevoClient = new Brevo.TransactionalEmailsApi()
    brevoClient.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    )
  }
  return brevoClient
}

// Default sender - can be overridden with environment variable
const getFromEmail = () => process.env.EMAIL_FROM || 'monity@example.com'
const getFromName = () => process.env.EMAIL_FROM_NAME || 'Monity'

/**
 * Send family invitation email
 */
export async function sendFamilyInvitationEmail({
  to,
  inviterName,
  householdName,
  inviteLink,
  locale = 'en',
}) {
  const isHebrew = locale === 'he'
  
  const subject = isHebrew
    ? `${inviterName} הזמין אותך להצטרף למשפחה ב-Monity`
    : `${inviterName} invited you to join their family on Monity`

  const html = generateInvitationEmailHtml({
    inviterName,
    householdName,
    inviteLink,
    isHebrew,
  })

  const text = generateInvitationEmailText({
    inviterName,
    householdName,
    inviteLink,
    isHebrew,
  })

  try {
    const brevo = getBrevoClient()
    if (!brevo) {
      throw new Error('Email service not configured')
    }

    const sendSmtpEmail = new Brevo.SendSmtpEmail()
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = html
    sendSmtpEmail.textContent = text
    sendSmtpEmail.sender = { 
      name: getFromName(), 
      email: getFromEmail() 
    }
    sendSmtpEmail.to = [{ email: to }]

    const result = await brevo.sendTransacEmail(sendSmtpEmail)

    console.log('Email sent successfully:', result?.body?.messageId || result)
    return { success: true, id: result?.body?.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

/**
 * Generate HTML email content
 */
function generateInvitationEmailHtml({ inviterName, householdName, inviteLink, isHebrew }) {
  const direction = isHebrew ? 'rtl' : 'ltr'
  const align = isHebrew ? 'right' : 'left'
  
  const content = isHebrew ? {
    title: 'הצטרף/י למשפחה ב-Monity',
    greeting: 'שלום,',
    message: `<strong>${inviterName}</strong> הזמין אותך להצטרף ל"${householdName}" ב-Monity - אפליקציה לניהול הוצאות משפחתי.`,
    benefits: [
      'עקבו אחר הוצאות משותפות',
      'נהלו תקציבים יחד',
      'צפו בדוחות משפחתיים',
      'הגדירו מטרות חיסכון משותפות',
    ],
    buttonText: 'קבל הזמנה',
    linkNote: 'או העתק את הלינק הבא:',
    expiry: 'ההזמנה תקפה ל-7 ימים.',
    footer: 'צוות Monity',
    ignore: 'אם לא ביקשת הזמנה זו, אפשר להתעלם מהאימייל.',
  } : {
    title: 'Join a Family on Monity',
    greeting: 'Hello,',
    message: `<strong>${inviterName}</strong> has invited you to join "${householdName}" on Monity - a family expense management app.`,
    benefits: [
      'Track shared expenses together',
      'Manage budgets as a family',
      'View family reports',
      'Set shared savings goals',
    ],
    buttonText: 'Accept Invitation',
    linkNote: 'Or copy this link:',
    expiry: 'This invitation expires in 7 days.',
    footer: 'The Monity Team',
    ignore: "If you didn't request this invitation, you can safely ignore this email.",
  }

  return `
<!DOCTYPE html>
<html dir="${direction}" lang="${isHebrew ? 'he' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; direction: ${direction};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Monity
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${content.title}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px; text-align: ${align};">
              <p style="margin: 0 0 16px; color: #334155; font-size: 16px;">
                ${content.greeting}
              </p>
              <p style="margin: 0 0 24px; color: #334155; font-size: 16px; line-height: 1.6;">
                ${content.message}
              </p>
              
              <!-- Benefits -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #475569; font-size: 14px; font-weight: 600;">
                  ${isHebrew ? 'מה תוכלו לעשות יחד:' : 'What you can do together:'}
                </p>
                <ul style="margin: 0; padding: 0 ${isHebrew ? '20px 0 0' : '0 0 0 20px'}; color: #64748b; font-size: 14px; line-height: 1.8;">
                  ${content.benefits.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${inviteLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                      ${content.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link fallback -->
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                ${content.linkNote}
              </p>
              <p style="margin: 0 0 24px; color: #3b82f6; font-size: 12px; word-break: break-all;">
                <a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a>
              </p>
              
              <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                ${content.expiry}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px; color: #475569; font-size: 14px;">
                ${content.footer}
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                ${content.ignore}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Generate plain text email content
 */
function generateInvitationEmailText({ inviterName, householdName, inviteLink, isHebrew }) {
  if (isHebrew) {
    return `
שלום,

${inviterName} הזמין אותך להצטרף ל"${householdName}" ב-Monity.

מה תוכלו לעשות יחד:
- עקבו אחר הוצאות משותפות
- נהלו תקציבים יחד
- צפו בדוחות משפחתיים
- הגדירו מטרות חיסכון משותפות

לחץ על הלינק הבא כדי לקבל את ההזמנה:
${inviteLink}

ההזמנה תקפה ל-7 ימים.

צוות Monity

---
אם לא ביקשת הזמנה זו, אפשר להתעלם מהאימייל.
`
  }

  return `
Hello,

${inviterName} has invited you to join "${householdName}" on Monity.

What you can do together:
- Track shared expenses together
- Manage budgets as a family
- View family reports
- Set shared savings goals

Click the link below to accept the invitation:
${inviteLink}

This invitation expires in 7 days.

The Monity Team

---
If you didn't request this invitation, you can safely ignore this email.
`
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured() {
  return !!process.env.BREVO_API_KEY
}
