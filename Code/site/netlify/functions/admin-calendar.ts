import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { verifyAdmin } from "./lib/admin-auth";

export default async function handler(req: Request) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "admin-calendar");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  const adminId = await verifyAdmin(req);
  if (!adminId) return errorResponse("Unauthorized", 401, origin);

  if (req.method === "GET") {
    const { data: days, error } = await supabaseAdmin
      .from("calendar_days")
      .select("*, recipe:recipes(id, slug, title, category)")
      .order("day_number");

    if (error) return errorResponse("Query failed", 500, origin);

    const warnings: string[] = [];
    for (const day of days ?? []) {
      if (!day.recipe_id) warnings.push(`Día ${day.day_number}: sin receta asignada`);
      if (!day.published) warnings.push(`Día ${day.day_number}: no publicado`);
    }

    return jsonResponse({ days: days ?? [], warnings }, 200, origin);
  }

  if (req.method === "POST") {
    let body: {
      action?: string;
      dayNumber?: number;
      recipeId?: string | null;
      title?: string | null;
      kind?: string;
      published?: boolean;
      specialContent?: Record<string, unknown> | null;
    };

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400, origin);
    }

    const action = body.action ?? "update";

    if (action === "update") {
      if (!body.dayNumber || body.dayNumber < 1 || body.dayNumber > 14) {
        return errorResponse("dayNumber must be between 1 and 14", 400, origin);
      }

      const updates: Record<string, unknown> = {};
      if (body.recipeId !== undefined) updates.recipe_id = body.recipeId;
      if (body.title !== undefined) updates.title = body.title;
      if (body.kind !== undefined) updates.kind = body.kind;
      if (body.published !== undefined) updates.published = body.published;
      if (body.specialContent !== undefined) updates.special_content = body.specialContent;

      if (Object.keys(updates).length === 0) {
        return errorResponse("No updates provided", 400, origin);
      }

      const { error } = await supabaseAdmin
        .from("calendar_days")
        .update(updates)
        .eq("day_number", body.dayNumber);

      if (error) return errorResponse("Error al actualizar día", 500, origin);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "update_calendar_day",
        entity_type: "calendar_day",
        entity_id: null,
        details: { day_number: body.dayNumber, ...updates },
      });

      return jsonResponse({ status: "updated" }, 200, origin);
    }

    if (action === "reorder") {
      const assignments = body as unknown as {
        action: string;
        assignments: { dayNumber: number; recipeId: string | null }[];
      };

      if (!assignments.assignments?.length) {
        return errorResponse("assignments array required", 400, origin);
      }

      for (const a of assignments.assignments) {
        if (a.dayNumber < 1 || a.dayNumber > 14) continue;
        await supabaseAdmin
          .from("calendar_days")
          .update({ recipe_id: a.recipeId })
          .eq("day_number", a.dayNumber);
      }

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "reorder_calendar",
        entity_type: "calendar_day",
        details: { count: assignments.assignments.length },
      });

      return jsonResponse({ status: "reordered" }, 200, origin);
    }

    if (action === "publish_all") {
      await supabaseAdmin
        .from("calendar_days")
        .update({ published: true })
        .not("recipe_id", "is", null);

      return jsonResponse({ status: "published" }, 200, origin);
    }

    return errorResponse("Invalid action", 400, origin);
  }

  return errorResponse("Method not allowed", 405, origin);
}
