import { env } from "../../worker/env";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { verifyAdmin } from "./lib/admin-auth";

const EDITABLE_KEYS = [
  "sales_enabled",
  "product_price_cents",
  "product_currency",
  "calendar_open_hour",
  "calendar_timezone",
  "calendar_year",
  "support_email",
  "zelle_recipient_name",
  "zelle_recipient_email",
  "zelle_recipient_phone",
  "zelle_instructions",
  "paypal_enabled",
  "ath_movil_enabled",
  "zelle_enabled",
];

export default async function handler(req: Request) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "admin-settings");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  const adminId = await verifyAdmin(req);
  if (!adminId) return errorResponse("Unauthorized", 401, origin);

  if (req.method === "GET") {
    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("key, value, updated_at");

    const warnings: string[] = [];

    const settingsMap: Record<string, unknown> = {};
    for (const s of settings ?? []) {
      settingsMap[s.key] = s.value;
    }

    if (settingsMap["sales_enabled"] !== true) {
      warnings.push("Las ventas están desactivadas.");
    }

    const priceCents = settingsMap["product_price_cents"];
    if (!priceCents || (typeof priceCents === "number" && priceCents <= 0)) {
      warnings.push("El precio del producto no está configurado.");
    }

    if (!env("PAYPAL_CLIENT_ID")) {
      warnings.push("PayPal no está configurado (falta PAYPAL_CLIENT_ID).");
    }

    if (!env("ATH_MOVIL_PUBLIC_TOKEN")) {
      warnings.push("ATH Móvil no está configurado (falta ATH_MOVIL_PUBLIC_TOKEN).");
    }

    if (!env("RESEND_API_KEY")) {
      warnings.push("El correo electrónico no está configurado (falta RESEND_API_KEY).");
    }

    const integrations = {
      supabase: true,
      paypal: !!env("PAYPAL_CLIENT_ID"),
      ath_movil: !!env("ATH_MOVIL_PUBLIC_TOKEN"),
      resend: !!env("RESEND_API_KEY"),
      zelle: !!(settingsMap["zelle_recipient_name"] || settingsMap["zelle_recipient_email"]),
    };

    return jsonResponse({ settings: settings ?? [], warnings, integrations }, 200, origin);
  }

  if (req.method === "POST") {
    let body: { key?: string; value?: unknown; updates?: { key: string; value: unknown }[] };
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400, origin);
    }

    if (body.updates?.length) {
      for (const u of body.updates) {
        if (!EDITABLE_KEYS.includes(u.key)) continue;

        if (u.key === "product_price_cents" && typeof u.value === "number") {
          if (u.value < 0) continue;
          await supabaseAdmin.rpc("set_setting", {
            p_key: u.key,
            p_value: JSON.stringify(u.value),
            p_admin_id: adminId,
          });

          const priceDecimal = (u.value / 100).toFixed(2);
          await supabaseAdmin
            .from("products")
            .update({ price_cents: u.value, price: priceDecimal, sales_enabled: u.value > 0 })
            .eq("active", true);
          continue;
        }

        if (u.key === "sales_enabled" && typeof u.value === "boolean") {
          await supabaseAdmin.rpc("set_setting", {
            p_key: u.key,
            p_value: JSON.stringify(u.value),
            p_admin_id: adminId,
          });

          await supabaseAdmin
            .from("products")
            .update({ sales_enabled: u.value })
            .eq("active", true);
          continue;
        }

        await supabaseAdmin.rpc("set_setting", {
          p_key: u.key,
          p_value: JSON.stringify(u.value),
          p_admin_id: adminId,
        });
      }

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "update_settings",
        entity_type: "settings",
        details: { keys: body.updates.map((u) => u.key) },
      });

      return jsonResponse({ status: "updated" }, 200, origin);
    }

    if (body.key && EDITABLE_KEYS.includes(body.key)) {
      await supabaseAdmin.rpc("set_setting", {
        p_key: body.key,
        p_value: JSON.stringify(body.value),
        p_admin_id: adminId,
      });

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "update_setting",
        entity_type: "settings",
        details: { key: body.key },
      });

      return jsonResponse({ status: "updated" }, 200, origin);
    }

    return errorResponse("Invalid key or updates", 400, origin);
  }

  return errorResponse("Method not allowed", 405, origin);
}
