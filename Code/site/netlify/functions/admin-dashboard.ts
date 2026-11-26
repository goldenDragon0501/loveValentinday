import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, supabaseAdmin } from "./lib/supabase";

async function verifyAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return false;

  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  return !!data;
}

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405, origin);
  }

  if (!(await verifyAdmin(req))) {
    return errorResponse("Unauthorized", 401, origin);
  }

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: paidOrders },
    { count: totalCustomers },
    { data: recentOrders },
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
    supabaseAdmin.from("customers").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("orders")
      .select("id, reference, status, total, payment_method, created_at, customer:customers(name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const { data: awaitingVerification } = await supabaseAdmin
    .from("orders")
    .select("id, reference, total, payment_method, created_at, customer:customers(name, email)")
    .eq("status", "awaiting_verification")
    .order("created_at", { ascending: false });

  return jsonResponse({
    stats: {
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      paidOrders: paidOrders ?? 0,
      totalCustomers: totalCustomers ?? 0,
    },
    awaitingVerification: awaitingVerification ?? [],
    recentOrders: recentOrders ?? [],
  }, 200, origin);
}
