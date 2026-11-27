import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse } from "./lib/supabase";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Phase 9: automated payments disabled — manual sales model active
  return errorResponse("El sistema de pagos automáticos ha sido deshabilitado.", 410, origin);

  /* --- original PayPal create logic preserved in git history for future reactivation --- */
}
