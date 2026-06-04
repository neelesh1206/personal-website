type VisitorEmail = {
  name: string
  resumeUrl?: string
}

const SIGNATURE = 'Neelesh Kakaraparthi\nneeleshkakaraparthi.dev'

export function visitorEmail({ name, resumeUrl }: VisitorEmail) {
  const subject = 'Thanks for reaching out — here is my resume'
  const resumeLine = resumeUrl
    ? `You can download my latest resume here:\n${resumeUrl}\n`
    : `My resume is on its way — I'll follow up directly within 24 hours.\n`
  const text = `Hi ${name},

Thanks for getting in touch via neeleshkakaraparthi.dev.

${resumeLine}
Happy to chat about Senior Software Engineer roles, full-stack systems work, or anything you read about on the site.

Cheers,
${SIGNATURE}`
  const html = `<p>Hi ${escapeHtml(name)},</p>
<p>Thanks for getting in touch via <a href="https://neeleshkakaraparthi.dev">neeleshkakaraparthi.dev</a>.</p>
${
  resumeUrl
    ? `<p>You can download my latest resume here: <a href="${resumeUrl}">${resumeUrl}</a>.</p>`
    : `<p>My resume is on its way — I'll follow up directly within 24 hours.</p>`
}
<p>Happy to chat about Senior Software Engineer roles, full-stack systems work, or anything you read about on the site.</p>
<p>Cheers,<br/>Neelesh Kakaraparthi<br/><a href="https://neeleshkakaraparthi.dev">neeleshkakaraparthi.dev</a></p>`
  return { subject, text, html }
}

type OwnerEmail = {
  name: string
  email: string
  message?: string
  referrer?: string
  createdAt: Date
}

export function ownerEmail({ name, email, message, referrer, createdAt }: OwnerEmail) {
  const subject = `New portfolio contact: ${name}`
  const lines = [
    `New contact form submission on neeleshkakaraparthi.dev`,
    ``,
    `Name:     ${name}`,
    `Email:    ${email}`,
    `When:     ${createdAt.toISOString()}`,
    referrer ? `Referrer: ${referrer}` : null,
    ``,
    message ? `Message:\n${message}` : `(no message)`,
  ].filter(Boolean)
  const text = lines.join('\n')
  const html = `<table style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">
<tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
<tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
<tr><td><strong>When</strong></td><td>${createdAt.toISOString()}</td></tr>
${referrer ? `<tr><td><strong>Referrer</strong></td><td>${escapeHtml(referrer)}</td></tr>` : ''}
</table>
<p style="white-space:pre-wrap;margin-top:12px;font-family:system-ui,sans-serif;font-size:14px">${
    message ? escapeHtml(message) : '<em>(no message)</em>'
  }</p>`
  return { subject, text, html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
