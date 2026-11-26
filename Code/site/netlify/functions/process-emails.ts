import type { Context } from "@netlify/functions";
import { jsonResponse, requireSupabase } from "./lib/supabase";
import { processEmailQueue } from "./lib/email-queue";

export default async function handler(req: Request, _context: Context) {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const dbCheck = requireSupabase();
  if (dbCheck) return dbCheck;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
  }

  try {
    const sent = await processEmailQueue();
    return jsonResponse({ sent }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    return jsonResponse({ error: message }, 500);
  }
}
