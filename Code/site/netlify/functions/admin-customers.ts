import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { verifyAdmin } from "./lib/admin-auth";
import { randomUUID } from "node:crypto";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "admin-customers");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  const adminId = await verifyAdmin(req);
  if (!adminId) return errorResponse("Unauthorized", 401, origin);

  const url = new URL(req.url);

  if (req.method === "GET") {
    const customerId = url.searchParams.get("id");
    const search = url.searchParams.get("search");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
    const offset = (page - 1) * limit;

    if (customerId) {
      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (!customer) return errorResponse("Customer not found", 404, origin);

      const [{ data: orders }, { data: access }] = await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("id, reference, status, total, payment_method, created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("customer_access")
          .select("id, active, expires_at, last_accessed_at, created_at, order_id, grant_type, access_token")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
      ]);

      return jsonResponse({
        customer,
        orders: orders ?? [],
        access: access ?? [],
      }, 200, origin);
    }

    let query = supabaseAdmin
      .from("customers")
      .select("id, email, name, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) return errorResponse("Query failed", 500, origin);

    return jsonResponse({ customers: data ?? [], total: count, page, limit }, 200, origin);
  }

  if (req.method === "POST") {
    let body: {
      action?: string;
      customerId?: string;
      orderId?: string;
      accessId?: string;
      name?: string;
      email?: string;
      notes?: string;
    };

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400, origin);
    }

    if (body.action === "revoke_access") {
      if (!body.accessId) return errorResponse("accessId required", 400, origin);

      await supabaseAdmin
        .from("customer_access")
        .update({ active: false })
        .eq("id", body.accessId);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "revoke_access",
        entity_type: "customer_access",
        entity_id: body.accessId,
      });

      return jsonResponse({ status: "revoked" }, 200, origin);
    }

    if (body.action === "activate_access") {
      if (!body.accessId) return errorResponse("accessId required", 400, origin);

      await supabaseAdmin
        .from("customer_access")
        .update({ active: true })
        .eq("id", body.accessId);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "activate_access",
        entity_type: "customer_access",
        entity_id: body.accessId,
      });

      return jsonResponse({ status: "activated" }, 200, origin);
    }

    if (body.action === "resend_access") {
      if (!body.customerId) return errorResponse("customerId required", 400, origin);

      const { data: access } = await supabaseAdmin
        .from("customer_access")
        .select("access_token")
        .eq("customer_id", body.customerId)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!access) return errorResponse("No hay acceso activo para este cliente.", 400, origin);

      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("name, email")
        .eq("id", body.customerId)
        .single();

      if (!customer) return errorResponse("Customer not found", 404, origin);

      const { queueEmail } = await import("./lib/email-queue");
      const { accessGrantedHtml } = await import("./lib/email");
      const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
      const accessUrl = `${baseUrl}/calendario/?token=${access.access_token}`;

      await queueEmail({
        to: customer.email,
        subject: "Tu enlace de acceso — 14 días de dulce amor",
        html: accessGrantedHtml(customer.name, accessUrl),
        template: "access_resend",
        customerId: body.customerId,
      });

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "resend_access_email",
        entity_type: "customer",
        entity_id: body.customerId,
      });

      return jsonResponse({ status: "email_queued" }, 200, origin);
    }

    if (body.action === "register_customer") {
      const email = body.email?.trim().toLowerCase();
      const name = body.name?.trim();
      if (!email || !email.includes("@")) return errorResponse("Email válido requerido", 400, origin);
      if (!name || name.length < 2) return errorResponse("Nombre requerido (mínimo 2 caracteres)", 400, origin);

      const { data: existing } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("email", email)
        .single();

      let customerId: string;
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: created, error: createErr } = await supabaseAdmin
          .from("customers")
          .insert({ email, name })
          .select("id")
          .single();
        if (createErr || !created) return errorResponse("Error al crear cliente", 500, origin);
        customerId = created.id;
      }

      const accessToken = randomUUID();
      const { error: accessErr } = await supabaseAdmin
        .from("customer_access")
        .insert({
          customer_id: customerId,
          access_token: accessToken,
          active: true,
          grant_type: "manual",
          granted_by: adminId,
          grant_notes: body.notes || null,
        });

      if (accessErr) return errorResponse("Error al crear acceso", 500, origin);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "register_customer_manual",
        entity_type: "customer",
        entity_id: customerId,
        details: { email, name, existed: !!existing },
      });

      const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
      const accessUrl = `${baseUrl}/calendario/?token=${accessToken}`;

      return jsonResponse({
        status: "registered",
        customerId,
        accessToken,
        accessUrl,
        existed: !!existing,
      }, 201, origin);
    }

    if (body.action === "generate_access_link") {
      if (!body.customerId) return errorResponse("customerId required", 400, origin);

      const { data: customer } = await supabaseAdmin
        .from("customers")
        .select("id, email")
        .eq("id", body.customerId)
        .single();
      if (!customer) return errorResponse("Cliente no encontrado", 404, origin);

      await supabaseAdmin
        .from("customer_access")
        .update({ active: false })
        .eq("customer_id", body.customerId)
        .eq("active", true);

      const accessToken = randomUUID();
      const { error: accessErr } = await supabaseAdmin
        .from("customer_access")
        .insert({
          customer_id: body.customerId,
          access_token: accessToken,
          active: true,
          grant_type: "manual",
          granted_by: adminId,
          grant_notes: body.notes || null,
        });

      if (accessErr) return errorResponse("Error al generar enlace", 500, origin);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "generate_access_link",
        entity_type: "customer",
        entity_id: body.customerId,
      });

      const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
      const accessUrl = `${baseUrl}/calendario/?token=${accessToken}`;

      return jsonResponse({
        status: "link_generated",
        accessToken,
        accessUrl,
      }, 200, origin);
    }

    return errorResponse("Invalid action", 400, origin);
  }

  return errorResponse("Method not allowed", 405, origin);
}
