import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, supabaseAdmin } from "./lib/supabase";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, origin);
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { token } = body;
  if (!token || typeof token !== "string") {
    return errorResponse("Access token required", 400, origin);
  }

  const { data: access, error } = await supabaseAdmin
    .from("customer_access")
    .select(`
      id, active, expires_at, last_accessed_at,
      customer:customers(name, email),
      order:orders(reference, status, payment_method)
    `)
    .eq("access_token", token)
    .single();

  if (error || !access) {
    return errorResponse("Invalid access token", 401, origin);
  }

  if (!access.active) {
    return errorResponse("Access has been revoked", 403, origin);
  }

  if (access.expires_at && new Date(access.expires_at) < new Date()) {
    return errorResponse("Access token expired", 403, origin);
  }

  await supabaseAdmin
    .from("customer_access")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", access.id);

  const orderArr = access.order as unknown as { reference?: string; status?: string; payment_method?: string }[] | null;
  const orderData = Array.isArray(orderArr) ? orderArr[0] : orderArr;

  return jsonResponse({
    valid: true,
    customer: access.customer,
    order: {
      reference: orderData?.reference ?? "",
      status: orderData?.status ?? "",
      paymentMethod: orderData?.payment_method ?? "",
    },
  }, 200, origin);
}
