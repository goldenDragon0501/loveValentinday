import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, supabaseAdmin } from "./lib/supabase";
import { sendEmail, accessGrantedHtml } from "./lib/email";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, origin);
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { email } = body;
  if (!email || typeof email !== "string") {
    return errorResponse("Email required", 400, origin);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Always return success to prevent email enumeration
  const genericMessage = "Si tienes una compra activa, recibirás un correo con tu enlace de acceso.";

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id, name, email")
    .eq("email", normalizedEmail)
    .single();

  if (!customer) {
    return jsonResponse({ message: genericMessage }, 200, origin);
  }

  const { data: access } = await supabaseAdmin
    .from("customer_access")
    .select("access_token")
    .eq("customer_id", customer.id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!access) {
    return jsonResponse({ message: genericMessage }, 200, origin);
  }

  const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
  const accessUrl = `${baseUrl}/calendario/?token=${access.access_token}`;

  try {
    await sendEmail({
      to: customer.email,
      subject: "Tu enlace de acceso — 14 días de dulce amor",
      html: accessGrantedHtml(customer.name, accessUrl),
    });

    await supabaseAdmin.from("email_logs").insert({
      customer_id: customer.id,
      template: "access_recovery",
      subject: "Tu enlace de acceso — 14 días de dulce amor",
      to_email: customer.email,
      status: "sent",
    });
  } catch {
    // non-fatal
  }

  return jsonResponse({ message: genericMessage }, 200, origin);
}
