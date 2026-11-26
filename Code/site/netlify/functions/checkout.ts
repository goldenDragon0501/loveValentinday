import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { randomBytes } from "node:crypto";

function generateReference(): string {
  const prefix = "DDA";
  const rand = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${rand}`;
}

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

  const rl = await checkRateLimit(req, "checkout");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos. Intente más tarde." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  let body: {
    email?: string;
    name?: string;
    paymentMethod?: string;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { email, name, paymentMethod } = body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return errorResponse("Valid email is required", 400, origin);
  }
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return errorResponse("Name is required", 400, origin);
  }
  const validMethods = ["ath_movil", "paypal", "zelle"];
  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    return errorResponse(`El método de pago debe ser uno de: ${validMethods.join(", ")}`, 400, origin);
  }

  const { data: salesEnabled } = await supabaseAdmin.rpc("get_setting", { p_key: "sales_enabled" });
  if (salesEnabled !== true) {
    return errorResponse("Las ventas estarán disponibles próximamente.", 400, origin);
  }

  const { data: product } = await supabaseAdmin
    .from("products")
    .select("id, price, price_cents, currency, sales_enabled")
    .eq("active", true)
    .limit(1)
    .single();

  if (!product) {
    return errorResponse("Producto no disponible.", 503, origin);
  }

  const priceCents = product.price_cents ?? Math.round((product.price ?? 0) * 100);
  if (priceCents <= 0 || !product.sales_enabled) {
    return errorResponse("Las ventas estarán disponibles próximamente.", 400, origin);
  }

  const priceDecimal = (priceCents / 100).toFixed(2);

  const normalizedEmail = email.trim().toLowerCase();

  let customer: { id: string };
  const { data: existing } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  if (existing) {
    customer = existing;
  } else {
    const { data: created, error } = await supabaseAdmin
      .from("customers")
      .insert({ email: normalizedEmail, name: name.trim() })
      .select("id")
      .single();
    if (error || !created) {
      return errorResponse("Failed to create customer", 500, origin);
    }
    customer = created;
  }

  const { data: methodEnabled } = await supabaseAdmin.rpc("get_setting", {
    p_key: `${paymentMethod}_enabled`,
  });
  if (methodEnabled !== true) {
    return errorResponse("Este método de pago no está disponible.", 400, origin);
  }

  const reference = generateReference();
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_id: customer.id,
      product_id: product.id,
      reference,
      total: priceDecimal,
      currency: product.currency,
      payment_method: paymentMethod,
      status: paymentMethod === "zelle" ? "awaiting_verification" : "pending",
    })
    .select("id, reference, total, currency, status")
    .single();

  if (orderErr || !order) {
    return errorResponse("Failed to create order", 500, origin);
  }

  const responseData: Record<string, unknown> = {
    order: {
      id: order.id,
      reference: order.reference,
      total: order.total,
      currency: order.currency,
      status: order.status,
      paymentMethod,
    },
  };

  if (paymentMethod === "zelle") {
    responseData.zelle = {
      recipientName: process.env.ZELLE_RECIPIENT_NAME ?? "",
      recipientEmail: process.env.ZELLE_RECIPIENT_EMAIL ?? "",
      recipientPhone: process.env.ZELLE_RECIPIENT_PHONE ?? "",
      instructions: `Envía $${priceDecimal} por Zelle. Incluye tu referencia ${reference} en la nota del pago.`,
    };
  }

  return jsonResponse(responseData, 201, origin);
}
