import { supabaseAdmin } from "./supabase";
import { sendEmail } from "./email";

interface QueueEmailParams {
  to: string;
  subject: string;
  html: string;
  template?: string;
  customerId?: string;
  orderId?: string;
  idempotencyKey?: string;
}

export async function queueEmail(params: QueueEmailParams): Promise<void> {
  await supabaseAdmin.from("email_queue").insert({
    to_email: params.to,
    subject: params.subject,
    html: params.html,
    template: params.template,
    customer_id: params.customerId ?? null,
    order_id: params.orderId ?? null,
    idempotency_key: params.idempotencyKey ?? null,
  });
}

export async function processEmailQueue(): Promise<number> {
  const { data: emails, error } = await supabaseAdmin.rpc("claim_pending_emails", {
    p_limit: 5,
  });

  if (error || !emails || !Array.isArray(emails)) return 0;

  let sent = 0;
  for (const email of emails) {
    try {
      const result = await sendEmail({
        to: email.to_email,
        subject: email.subject,
        html: email.html,
      });

      await supabaseAdmin
        .from("email_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_id: result.id,
        })
        .eq("id", email.id);

      sent++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const newStatus = email.attempts >= email.max_attempts ? "failed" : "pending";

      await supabaseAdmin
        .from("email_queue")
        .update({ status: newStatus, error: errorMsg })
        .eq("id", email.id);
    }
  }

  return sent;
}
