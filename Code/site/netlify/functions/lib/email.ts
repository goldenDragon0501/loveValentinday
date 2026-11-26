const RESEND_API = "https://api.resend.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";
  const fromName = process.env.RESEND_FROM_NAME ?? "14 días de dulce amor";

  const res = await fetch(`${RESEND_API}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend failed: ${res.status} ${err}`);
  }

  return res.json();
}

export function purchaseConfirmationHtml(name: string, reference: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h1 style="color:#e91e63;font-size:22px;">¡Gracias, ${escapeHtml(name)}! 💕</h1>
  <p>Tu compra de <strong>14 días de dulce amor</strong> ha sido confirmada.</p>
  <p><strong>Referencia:</strong> ${escapeHtml(reference)}</p>
  <p>Recibirás un enlace de acceso a tu calendario cuando el pago sea verificado.</p>
  <p style="color:#888;font-size:13px;margin-top:32px;">Si no realizaste esta compra, puedes ignorar este correo.</p>
</body>
</html>`;
}

export function accessGrantedHtml(name: string, accessUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h1 style="color:#e91e63;font-size:22px;">¡Tu calendario está listo! 🎉</h1>
  <p>Hola ${escapeHtml(name)},</p>
  <p>Tu acceso a <strong>14 días de dulce amor</strong> ha sido activado.</p>
  <p><a href="${escapeHtml(accessUrl)}" style="display:inline-block;padding:12px 24px;background:#e91e63;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Abrir mi calendario</a></p>
  <p style="color:#888;font-size:13px;margin-top:32px;">Guarda este correo — el enlace es personal y te da acceso a todas las recetas.</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
