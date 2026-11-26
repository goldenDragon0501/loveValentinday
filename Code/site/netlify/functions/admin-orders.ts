import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, supabaseAdmin } from "./lib/supabase";
import { sendEmail, accessGrantedHtml } from "./lib/email";
import { randomBytes } from "node:crypto";

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

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
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
      .select("*, customer:customers(id, name, email)")
      .eq("id", orderId)
      .single();

    if (!order) return errorResponse("Order not found", 404, origin);

    if (action === "approve") {
      if (order.status === "paid") {
        return errorResponse("Order has already been approved", 400, origin);
      }
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid", notes })
        .eq("id", orderId);

      await supabaseAdmin
        .from("payments")
        .update({ status: "completed", verified_at: new Date().toISOString(), verified_by: adminId })
        .eq("order_id", orderId)
        .eq("status", "pending");

      const accessToken = randomBytes(32).toString("hex");
      const customerArr = order.customer as unknown as { id: string; name: string; email: string }[] | null;
      const customer = Array.isArray(customerArr) ? customerArr[0] : customerArr;
      if (!customer) return errorResponse("Customer not found on order", 500, origin);

      await supabaseAdmin.from("customer_access").insert({
        customer_id: customer.id,
        order_id: orderId,
        access_token: accessToken,
        active: true,
      });

      const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
      const accessUrl = `${baseUrl}/calendario/?token=${accessToken}`;

      try {
        await sendEmail({
          to: customer.email,
          subject: "¡Tu calendario está listo!",
          html: accessGrantedHtml(customer.name, accessUrl),
        });
      } catch {
        // non-fatal
      }

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "approve_order",
        entity_type: "order",
        entity_id: orderId,
        details: { notes },
      });

      return jsonResponse({ status: "approved", accessToken }, 200, origin);
    }

    if (action === "reject") {
      if (order.status === "paid") {
        return errorResponse("Cannot reject a paid order", 400, origin);
      }
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed", notes })
        .eq("id", orderId);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "reject_order",
        entity_type: "order",
        entity_id: orderId,
        details: { notes },
      });

      return jsonResponse({ status: "rejected" }, 200, origin);
    }

    return errorResponse("Invalid action. Use 'approve' or 'reject'", 400, origin);
  }

  return errorResponse("Method not allowed", 405, origin);
}
