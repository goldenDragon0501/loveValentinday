import { supabaseAdmin } from "./supabase";
import { queueEmail } from "./email-queue";
import { accessGrantedHtml, purchaseConfirmationHtml } from "./email";

interface FinalizeParams {
  paymentId: string;
  externalId?: string;
  verifiedBy?: string;
  captureAmount?: number;
  captureCurrency?: string;
  rawResponse?: Record<string, unknown>;
  notes?: string;
  idempotencyKey?: string;
}

interface FinalizeResult {
  success: boolean;
  alreadyCompleted?: boolean;
  accessToken?: string;
  orderReference?: string;
  customerName?: string;
  customerEmail?: string;
  error?: string;
}

export async function finalizePayment(params: FinalizeParams): Promise<FinalizeResult> {
  const { data, error } = await supabaseAdmin.rpc("finalize_payment", {
    p_payment_id: params.paymentId,
    p_external_id: params.externalId ?? null,
    p_verified_by: params.verifiedBy ?? null,
    p_capture_amount: params.captureAmount ?? null,
    p_capture_currency: params.captureCurrency ?? null,
    p_raw_response: params.rawResponse ?? null,
    p_notes: params.notes ?? null,
    p_idempotency_key: params.idempotencyKey ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as {
    success: boolean;
    already_completed?: boolean;
    access_token?: string;
    order_reference?: string;
    customer_name?: string;
    customer_email?: string;
    error?: string;
  };

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.already_completed && result.customer_email && result.access_token) {
    const baseUrl = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
    const accessUrl = `${baseUrl}/calendario/?token=${result.access_token}`;

    await queueEmail({
      to: result.customer_email,
      subject: "¡Tu calendario está listo!",
      html: accessGrantedHtml(result.customer_name ?? "", accessUrl),
      template: "access_granted",
      orderId: undefined,
      customerId: undefined,
      idempotencyKey: `access_email_${params.paymentId}`,
    });

    await queueEmail({
      to: result.customer_email,
      subject: "Tu compra de 14 días de dulce amor",
      html: purchaseConfirmationHtml(result.customer_name ?? "", result.order_reference ?? ""),
      template: "purchase_confirmation",
      orderId: undefined,
      customerId: undefined,
      idempotencyKey: `confirm_email_${params.paymentId}`,
    });
  }

  return {
    success: true,
    alreadyCompleted: result.already_completed,
    accessToken: result.access_token,
    orderReference: result.order_reference,
    customerName: result.customer_name,
    customerEmail: result.customer_email,
  };
}
