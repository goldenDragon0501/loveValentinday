import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { createPayPalOrder } from "./lib/paypal";

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

  const rl = await checkRateLimit(req, "paypal-create");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos. Intente más tarde." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { orderId } = body;
  if (!orderId) return errorResponse("Order ID required", 400, origin);

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, reference, total, currency, status, payment_method")
    .eq("id", orderId)
    .single();

  if (!order) return errorResponse("Order not found", 404, origin);
  if (order.payment_method !== "paypal") {
    return errorResponse("Order is not a PayPal order", 400, origin);
  }
  if (order.status !== "pending") {
    return errorResponse("Order is not in pending state", 400, origin);
  }

  try {
    const ppOrder = await createPayPalOrder(
      String(order.total),
      order.currency,
      order.reference
    );

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      payment_method: "paypal",
      external_id: ppOrder.id,
      amount: order.total,
      currency: order.currency,
      status: "processing",
      raw_response: ppOrder,
    });

    return jsonResponse({ paypalOrderId: ppOrder.id }, 201, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PayPal error";
    return errorResponse(message, 502, origin);
  }
}
