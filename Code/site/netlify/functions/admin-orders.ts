import { env } from "../../worker/env";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { finalizePayment } from "./lib/finalize-payment";

async function verifyAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: admin } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return admin?.id ?? null;
}

export default async function handler(req: Request) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "admin-orders");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos. Intente más tarde." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  const adminId = await verifyAdmin(req);
  if (!adminId) return errorResponse("Unauthorized", 401, origin);

  const url = new URL(req.url);

  if (req.method === "GET") {
    const status = url.searchParams.get("status");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10)));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("orders")
      .select("*, customer:customers(name, email), payments(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) return errorResponse("Query failed", 500, origin);

    return jsonResponse({ orders: data, total: count, page, limit }, 200, origin);
  }

  if (req.method === "POST") {
    let body: { orderId?: string; action?: string; notes?: string };
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400, origin);
    }

    const { orderId, action, notes } = body;
    if (!orderId || !action) {
      return errorResponse("orderId and action required", 400, origin);
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*, customer:customers(id, name, email), payments(*)")
      .eq("id", orderId)
      .single();

    if (!order) return errorResponse("Order not found", 404, origin);

    if (action === "approve") {
      if (order.status === "paid") {
        return errorResponse("Esta orden ya fue aprobada.", 400, origin);
      }

      const payments = order.payments as { id: string; status: string }[];
      const pendingPayment = payments?.find((p) => p.status === "pending" || p.status === "processing");
      if (!pendingPayment) {
        return errorResponse("No hay pago pendiente para esta orden.", 400, origin);
      }

      const result = await finalizePayment({
        paymentId: pendingPayment.id,
        verifiedBy: adminId,
        notes: notes ?? undefined,
        idempotencyKey: `admin_approve_${orderId}_${adminId}`,
      });

      if (!result.success) {
        return errorResponse(result.error ?? "Error al aprobar", 400, origin);
      }

      return jsonResponse({
        status: "approved",
        accessToken: result.accessToken,
        alreadyCompleted: result.alreadyCompleted,
      }, 200, origin);
    }

    if (action === "reject") {
      if (order.status === "paid") {
        return errorResponse("No se puede rechazar una orden pagada.", 400, origin);
      }

      await supabaseAdmin
        .from("orders")
        .update({ status: "failed", notes })
        .eq("id", orderId);

      await supabaseAdmin
        .from("payments")
        .update({ status: "failed" })
        .eq("order_id", orderId)
        .in("status", ["pending", "processing"]);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "reject_order",
        entity_type: "order",
        entity_id: orderId,
        details: { notes },
      });

      return jsonResponse({ status: "rejected" }, 200, origin);
    }

    if (action === "resend_email") {
      const customerArr = order.customer as unknown as { id: string; name: string; email: string }[] | null;
      const customer = Array.isArray(customerArr) ? customerArr[0] : customerArr;
      if (!customer) return errorResponse("Customer not found", 404, origin);

      if (order.status !== "paid") {
        return errorResponse("Solo se puede reenviar el correo de una orden pagada.", 400, origin);
      }

      const { data: access } = await supabaseAdmin
        .from("customer_access")
        .select("access_token")
        .eq("order_id", orderId)
        .eq("active", true)
        .limit(1)
        .single();

      if (!access) {
        return errorResponse("No hay acceso activo para esta orden.", 400, origin);
      }

      const { queueEmail } = await import("./lib/email-queue");
      const { accessGrantedHtml } = await import("./lib/email");
      const baseUrl = env("PUBLIC_URL") ?? "https://lovevalentinday.netlify.app";
      const accessUrl = `${baseUrl}/calendario/?token=${access.access_token}`;

      await queueEmail({
        to: customer.email,
        subject: "¡Tu calendario está listo!",
        html: accessGrantedHtml(customer.name, accessUrl),
        template: "access_granted_resend",
        customerId: customer.id,
        orderId,
      });

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "resend_email",
        entity_type: "order",
        entity_id: orderId,
      });

      return jsonResponse({ status: "email_queued" }, 200, origin);
    }

    return errorResponse("Acción inválida. Use 'approve', 'reject' o 'resend_email'.", 400, origin);
  }

  return errorResponse("Method not allowed", 405, origin);
}
