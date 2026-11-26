import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, supabaseAdmin } from "./lib/supabase";
import { capturePayPalOrder } from "./lib/paypal";
import { sendEmail, purchaseConfirmationHtml, accessGrantedHtml } from "./lib/email";
import { randomBytes } from "node:crypto";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, origin);
  }

  let body: { paypalOrderId?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400, origin);
  }

  const { paypalOrderId } = body;
  if (!paypalOrderId) return errorResponse("PayPal order ID required", 400, origin);

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("id, order_id, status")
    .eq("external_id", paypalOrderId)
    .eq("payment_method", "paypal")
    .single();

  if (!payment) return errorResponse("Payment not found", 404, origin);
  if (payment.status === "completed") {
    return errorResponse("Payment already captured", 400, origin);
  }

  try {
    const capture = await capturePayPalOrder(paypalOrderId);
    const captureStatus = capture.status;

    await supabaseAdmin
      .from("payments")
      .update({
        status: captureStatus === "COMPLETED" ? "completed" : "failed",
        raw_response: capture,
        verified_at: captureStatus === "COMPLETED" ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);

    if (captureStatus === "COMPLETED") {
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", payment.order_id);

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, reference, customer_id, customer:customers(name, email)")
        .eq("id", payment.order_id)
        .single();

      if (order) {
        const accessToken = randomBytes(32).toString("hex");
        await supabaseAdmin.from("customer_access").insert({
          customer_id: order.customer_id,
          order_id: order.id,
          access_token: accessToken,
          active: true,
        });

        const customerArr = order.customer as unknown as { name: string; email: string }[] | null;
        const customer = Array.isArray(customerArr) ? customerArr[0] : customerArr;
        const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
        const accessUrl = `${baseUrl}/calendario/?token=${accessToken}`;

        if (!customer) {
          return jsonResponse({ status: "completed", accessToken, accessUrl }, 200, origin);
        }

        try {
          const confirmResult = await sendEmail({
            to: customer.email,
            subject: "Tu compra de 14 días de dulce amor",
            html: purchaseConfirmationHtml(customer.name, order.reference),
          });
          await supabaseAdmin.from("email_logs").insert({
            customer_id: order.customer_id,
            template: "purchase_confirmation",
            subject: "Tu compra de 14 días de dulce amor",
            to_email: customer.email,
            status: "sent",
            resend_id: confirmResult.id,
          });
        } catch {
          // Email failure should not break the payment flow
        }

        try {
          const accessResult = await sendEmail({
            to: customer.email,
            subject: "¡Tu calendario está listo!",
            html: accessGrantedHtml(customer.name, accessUrl),
          });
          await supabaseAdmin.from("email_logs").insert({
            customer_id: order.customer_id,
            template: "access_granted",
            subject: "¡Tu calendario está listo!",
            to_email: customer.email,
            status: "sent",
            resend_id: accessResult.id,
          });
        } catch {
          // Email failure should not break the payment flow
        }

        return jsonResponse({
          status: "completed",
          accessToken,
          accessUrl,
        }, 200, origin);
      }
    }

    return jsonResponse({ status: captureStatus.toLowerCase() }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Capture failed";
    return errorResponse(message, 502, origin);
  }
}
