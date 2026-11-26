import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { capturePayPalOrder } from "./lib/paypal";
import { finalizePayment } from "./lib/finalize-payment";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, origin);
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "paypal-capture");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos. Intente más tarde." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  let body: { paypalOrderId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { paypalOrderId } = body;
  if (!paypalOrderId) return errorResponse("PayPal order ID required", 400, origin);

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, order_id, amount, currency, status")
    .eq("external_id", paypalOrderId)
    .eq("payment_method", "paypal")
    .single();

  if (!payment) return errorResponse("Payment not found", 404, origin);

  if (payment.status === "completed") {
    const { data: existingAccess } = await supabaseAdmin
      .from("customer_access")
      .select("access_token")
      .eq("order_id", payment.order_id)
      .eq("active", true)
      .limit(1)
      .single();

    const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
    return jsonResponse({
      status: "completed",
      accessToken: existingAccess?.access_token,
      accessUrl: existingAccess
        ? `${baseUrl}/calendario/?token=${existingAccess.access_token}`
        : undefined,
    }, 200, origin);
  }

  try {
    const capture = await capturePayPalOrder(paypalOrderId);
    const captureStatus = capture.status;

    if (captureStatus !== "COMPLETED") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", raw_response: capture })
        .eq("id", payment.id);
      return jsonResponse({ status: captureStatus.toLowerCase() }, 200, origin);
    }

    const unit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedAmount = unit?.amount?.value;
    const capturedCurrency = unit?.amount?.currency_code;

    const result = await finalizePayment({
      paymentId: payment.id,
      externalId: paypalOrderId,
      captureAmount: capturedAmount ? parseFloat(capturedAmount) : undefined,
      captureCurrency: capturedCurrency ?? undefined,
      rawResponse: capture,
      idempotencyKey: `paypal_capture_${paypalOrderId}`,
    });

    if (!result.success) {
      return errorResponse(result.error ?? "Finalization failed", 400, origin);
    }

    const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
    return jsonResponse({
      status: "completed",
      accessToken: result.accessToken,
      accessUrl: result.accessToken
        ? `${baseUrl}/calendario/?token=${result.accessToken}`
        : undefined,
    }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Capture failed";
    return errorResponse(message, 502, origin);
  }
}
