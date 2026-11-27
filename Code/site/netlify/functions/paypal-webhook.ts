import { errorResponse } from "./lib/supabase";

export default async function handler(req: Request) {
  // Phase 9: automated payments disabled — manual sales model active
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }
  return errorResponse("El sistema de pagos automáticos ha sido deshabilitado.", 410);

  /* --- original PayPal webhook logic preserved in git history for future reactivation --- */
}
