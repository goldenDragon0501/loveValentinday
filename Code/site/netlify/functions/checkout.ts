import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse } from "./lib/supabase";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Phase 9: automated payments disabled — manual sales model active
  return errorResponse("El sistema de pagos automáticos ha sido deshabilitado. Contacte al vendedor directamente.", 410, origin);

  /* --- original checkout logic preserved below for potential future reactivation ---
  See git history for the complete working implementation.
  To reactivate: remove the return statement above and uncomment this block. --- */
}
