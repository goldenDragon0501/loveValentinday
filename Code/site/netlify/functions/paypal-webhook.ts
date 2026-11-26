import type { Context } from "@netlify/functions";
import { errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit } from "./lib/rate-limit";
import { finalizePayment } from "./lib/finalize-payment";

async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const apiBase = process.env.PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) return false;
  const { access_token } = await tokenRes.json();

  const verifyRes = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!verifyRes.ok) return false;
  const result = await verifyRes.json();
  return result.verification_status === "SUCCESS";
}

export default async function handler(req: Request, _context: Context) {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const dbCheck = requireSupabase();
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "paypal-webhook");
  if (!rl.allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  const rawBody = await req.text();
  let event: {
    id?: string;
    event_type?: string;
    resource?: {
      id?: string;
      status?: string;
      amount?: { value?: string; currency_code?: string };
      supplementary_data?: {
        related_ids?: { order_id?: string };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  if (!event.id || !event.event_type) {
    return errorResponse("Invalid webhook payload", 400);
  }

  const verified = await verifyWebhookSignature(req, rawBody);
  if (!verified) {
    return errorResponse("Signature verification failed", 401);
  }

  const { error: dupError } = await supabaseAdmin.from("webhook_events").insert({
    provider: "paypal",
    event_id: event.id,
    event_type: event.event_type,
    payload: event as Record<string, unknown>,
  });

  if (dupError?.code === "23505") {
    return jsonResponse({ status: "already_processed" }, 200);
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const captureId = event.resource?.id;
    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
    const amount = event.resource?.amount?.value;
    const currency = event.resource?.amount?.currency_code;

    if (paypalOrderId) {
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("id, status")
        .eq("external_id", paypalOrderId)
        .eq("payment_method", "paypal")
        .single();

      if (payment && payment.status !== "completed") {
        await finalizePayment({
          paymentId: payment.id,
          externalId: captureId ?? paypalOrderId,
          captureAmount: amount ? parseFloat(amount) : undefined,
          captureCurrency: currency ?? undefined,
          rawResponse: event as unknown as Record<string, unknown>,
          idempotencyKey: `webhook_${event.id}`,
        });
      }
    }

    await supabaseAdmin
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("provider", "paypal")
      .eq("event_id", event.id);
  }

  if (event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.REVERSED") {
    const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;

    if (paypalOrderId) {
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("id, order_id")
        .eq("external_id", paypalOrderId)
        .eq("payment_method", "paypal")
        .single();

      if (payment) {
        await supabaseAdmin
          .from("payments")
          .update({
            status: event.event_type.includes("REVERSED") ? "refunded" : "failed",
            raw_response: event as unknown as Record<string, unknown>,
          })
          .eq("id", payment.id);

        if (event.event_type.includes("REVERSED")) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "refunded" })
            .eq("id", payment.order_id);

          await supabaseAdmin
            .from("customer_access")
            .update({ active: false })
            .eq("order_id", payment.order_id);
        }
      }
    }

    await supabaseAdmin
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("provider", "paypal")
      .eq("event_id", event.id);
  }

  return jsonResponse({ status: "ok" }, 200);
}
