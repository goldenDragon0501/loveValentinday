import type { Context } from "@netlify/functions";
import {
  corsHeaders,
  errorResponse,
  getUnlockTime,
  jsonResponse,
  supabaseAdmin,
} from "./lib/supabase";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405, origin);
  }

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  const token = url.searchParams.get("token") ?? req.headers.get("x-access-token");

  if (!dayParam) return errorResponse("Missing day parameter", 400, origin);

  const dayNumber = parseInt(dayParam, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 14) {
    return errorResponse("Invalid day number", 400, origin);
  }

  if (!token) return errorResponse("Access token required", 401, origin);

  const { data: access, error: accessErr } = await supabaseAdmin
    .from("customer_access")
    .select("id, customer_id, active, expires_at")
    .eq("access_token", token)
    .single();

  if (accessErr || !access) {
    return errorResponse("Invalid access token", 401, origin);
  }

  if (!access.active) {
    return errorResponse("Access has been revoked", 403, origin);
  }

  if (access.expires_at && new Date(access.expires_at) < new Date()) {
    return errorResponse("Access token expired", 403, origin);
  }

  const unlock = getUnlockTime(dayNumber);
  if (Date.now() < unlock.getTime()) {
    return errorResponse("This day has not been unlocked yet", 403, origin);
  }

  const { data: day } = await supabaseAdmin
    .from("calendar_days")
    .select("day_number, date, title, kind, special_content, recipe_id")
    .eq("day_number", dayNumber)
    .single();

  if (!day) return errorResponse("Day not found", 404, origin);

  let recipe = null;
  if (day.recipe_id) {
    const { data: r } = await supabaseAdmin
      .from("recipes")
      .select("slug, title, category, description, preparation_steps, baking_instructions, notes")
      .eq("id", day.recipe_id)
      .single();

    if (r) {
      const { data: ingredients } = await supabaseAdmin
        .from("recipe_ingredients")
        .select("group_name, item, sort_order")
        .eq("recipe_id", day.recipe_id)
        .order("sort_order");

      const { data: videos } = await supabaseAdmin
        .from("recipe_videos")
        .select("youtube_id, title, sort_order")
        .eq("recipe_id", day.recipe_id)
        .order("sort_order");

      const { data: downloads } = await supabaseAdmin
        .from("recipe_downloads")
        .select("file_name, file_type")
        .eq("recipe_id", day.recipe_id);

      recipe = {
        ...r,
        ingredients: ingredients ?? [],
        videos: videos ?? [],
        downloads: downloads ?? [],
      };
    }
  }

  await supabaseAdmin
    .from("customer_access")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", access.id);

  return jsonResponse({
    day: {
      dayNumber: day.day_number,
      date: day.date,
      title: day.title,
      kind: day.kind,
      specialContent: day.special_content,
    },
    recipe,
  }, 200, origin);
}
