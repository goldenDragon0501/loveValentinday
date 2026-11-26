import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { verifyAdmin } from "./lib/admin-auth";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405, origin);
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "admin-dashboard");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos. Intente más tarde." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  if (!(await verifyAdmin(req))) {
    return errorResponse("Unauthorized", 401, origin);
  }

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: paidOrders },
    { count: failedOrders },
    { count: totalCustomers },
    { data: recentOrders },
    { data: awaitingVerification },
    { data: paidOrdersData },
    { data: settings },
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).in("status", ["pending", "awaiting_verification"]),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("status", "failed"),
    supabaseAdmin.from("customers").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("orders")
      .select("id, reference, status, total, payment_method, created_at, customer:customers(name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("orders")
      .select("id, reference, total, payment_method, created_at, customer:customers(name, email)")
      .eq("status", "awaiting_verification")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("orders")
      .select("total, payment_method")
      .eq("status", "paid"),
    supabaseAdmin.from("app_settings").select("key, value"),
  ]);

  let totalRevenue = 0;
  const revenueByMethod: Record<string, number> = {};
  for (const o of paidOrdersData ?? []) {
    const amount = parseFloat(o.total) || 0;
    totalRevenue += amount;
    const method = o.payment_method ?? "unknown";
    revenueByMethod[method] = (revenueByMethod[method] ?? 0) + amount;
  }

  const warnings: string[] = [];
  const settingsMap: Record<string, unknown> = {};
  for (const s of settings ?? []) {
    settingsMap[s.key] = s.value;
  }

  if (settingsMap["sales_enabled"] !== true) warnings.push("Las ventas están desactivadas.");
  const priceCents = settingsMap["product_price_cents"];
  if (!priceCents || (typeof priceCents === "number" && priceCents <= 0)) {
    warnings.push("El precio del producto no está configurado.");
  }
  if (!process.env.RESEND_API_KEY) warnings.push("Email no configurado.");
  if (!process.env.PAYPAL_CLIENT_ID) warnings.push("PayPal no configurado.");

  return jsonResponse({
    stats: {
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      paidOrders: paidOrders ?? 0,
      failedOrders: failedOrders ?? 0,
      totalCustomers: totalCustomers ?? 0,
      totalRevenue: totalRevenue.toFixed(2),
      revenueByMethod,
    },
    warnings,
    awaitingVerification: awaitingVerification ?? [],
    recentOrders: recentOrders ?? [],
  }, 200, origin);
}
