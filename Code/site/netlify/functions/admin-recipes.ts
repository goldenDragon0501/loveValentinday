import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, jsonResponse, requireSupabase, supabaseAdmin } from "./lib/supabase";
import { checkRateLimit, rateLimitHeaders } from "./lib/rate-limit";
import { verifyAdmin } from "./lib/admin-auth";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const dbCheck = requireSupabase(origin);
  if (dbCheck) return dbCheck;

  const rl = await checkRateLimit(req, "admin-recipes");
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Demasiados intentos." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...rateLimitHeaders(rl.retryAfter) },
    });
  }

  const adminId = await verifyAdmin(req);
  if (!adminId) return errorResponse("Unauthorized", 401, origin);

  const url = new URL(req.url);

  if (req.method === "GET") {
    const recipeId = url.searchParams.get("id");

    if (recipeId) {
      const { data: recipe, error } = await supabaseAdmin
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (error || !recipe) return errorResponse("Recipe not found", 404, origin);

      const [{ data: ingredients }, { data: videos }, { data: downloads }] = await Promise.all([
        supabaseAdmin.from("recipe_ingredients").select("*").eq("recipe_id", recipeId).order("sort_order"),
        supabaseAdmin.from("recipe_videos").select("*").eq("recipe_id", recipeId).order("sort_order"),
        supabaseAdmin.from("recipe_downloads").select("*").eq("recipe_id", recipeId),
      ]);

      return jsonResponse({
        ...recipe,
        ingredients: ingredients ?? [],
        videos: videos ?? [],
        downloads: downloads ?? [],
      }, 200, origin);
    }

    const { data: recipes, error } = await supabaseAdmin
      .from("recipes")
      .select("id, slug, title, category, created_at, updated_at")
      .order("title");

    if (error) return errorResponse("Query failed", 500, origin);
    return jsonResponse({ recipes: recipes ?? [] }, 200, origin);
  }

  if (req.method === "POST") {
    let body: {
      action?: string;
      id?: string;
      slug?: string;
      title?: string;
      category?: string;
      description?: string;
      preparation_steps?: string[];
      baking_instructions?: string[];
      notes?: string[];
      ingredients?: { group_name?: string; item: string; sort_order: number }[];
      videos?: { youtube_id: string; title: string; sort_order: number }[];
    };

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON", 400, origin);
    }

    const action = body.action ?? "create";

    if (action === "create") {
      if (!body.title || !body.slug) {
        return errorResponse("Title and slug are required", 400, origin);
      }

      const { data: recipe, error } = await supabaseAdmin
        .from("recipes")
        .insert({
          slug: body.slug,
          title: body.title,
          category: body.category ?? "dessert",
          description: body.description ?? null,
          preparation_steps: body.preparation_steps ?? null,
          baking_instructions: body.baking_instructions ?? null,
          notes: body.notes ?? null,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") return errorResponse("Ya existe una receta con ese slug.", 400, origin);
        return errorResponse("Error al crear receta", 500, origin);
      }

      if (body.ingredients?.length) {
        await supabaseAdmin.from("recipe_ingredients").insert(
          body.ingredients.map((i) => ({ recipe_id: recipe.id, ...i })),
        );
      }

      if (body.videos?.length) {
        for (const v of body.videos) {
          const ytId = extractYouTubeId(v.youtube_id);
          if (!ytId) continue;
          await supabaseAdmin.from("recipe_videos").insert({
            recipe_id: recipe.id,
            youtube_id: ytId,
            title: v.title,
            sort_order: v.sort_order,
          });
        }
      }

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "create_recipe",
        entity_type: "recipe",
        entity_id: recipe.id,
        details: { title: body.title },
      });

      return jsonResponse({ id: recipe.id }, 201, origin);
    }

    if (action === "update") {
      if (!body.id) return errorResponse("Recipe ID required", 400, origin);

      const updates: Record<string, unknown> = {};
      if (body.title !== undefined) updates.title = body.title;
      if (body.slug !== undefined) updates.slug = body.slug;
      if (body.category !== undefined) updates.category = body.category;
      if (body.description !== undefined) updates.description = body.description;
      if (body.preparation_steps !== undefined) updates.preparation_steps = body.preparation_steps;
      if (body.baking_instructions !== undefined) updates.baking_instructions = body.baking_instructions;
      if (body.notes !== undefined) updates.notes = body.notes;

      if (Object.keys(updates).length) {
        const { error } = await supabaseAdmin.from("recipes").update(updates).eq("id", body.id);
        if (error) return errorResponse("Error al actualizar receta", 500, origin);
      }

      if (body.ingredients !== undefined) {
        await supabaseAdmin.from("recipe_ingredients").delete().eq("recipe_id", body.id);
        if (body.ingredients.length) {
          await supabaseAdmin.from("recipe_ingredients").insert(
            body.ingredients.map((i) => ({ recipe_id: body.id!, ...i })),
          );
        }
      }

      if (body.videos !== undefined) {
        await supabaseAdmin.from("recipe_videos").delete().eq("recipe_id", body.id);
        for (const v of body.videos) {
          const ytId = extractYouTubeId(v.youtube_id);
          if (!ytId) continue;
          await supabaseAdmin.from("recipe_videos").insert({
            recipe_id: body.id,
            youtube_id: ytId,
            title: v.title,
            sort_order: v.sort_order,
          });
        }
      }

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "update_recipe",
        entity_type: "recipe",
        entity_id: body.id,
      });

      return jsonResponse({ status: "updated" }, 200, origin);
    }

    if (action === "archive") {
      if (!body.id) return errorResponse("Recipe ID required", 400, origin);

      const { data: linked } = await supabaseAdmin
        .from("calendar_days")
        .select("day_number")
        .eq("recipe_id", body.id);

      if (linked?.length) {
        return errorResponse(
          `Esta receta está asignada a los días: ${linked.map((d) => d.day_number).join(", ")}. Desasígnala primero.`,
          400,
          origin,
        );
      }

      await supabaseAdmin.from("recipes").update({ category: "special" }).eq("id", body.id);

      await supabaseAdmin.from("audit_logs").insert({
        admin_id: adminId,
        action: "archive_recipe",
        entity_type: "recipe",
        entity_id: body.id,
      });

      return jsonResponse({ status: "archived" }, 200, origin);
    }

    return errorResponse("Invalid action", 400, origin);
  }

  return errorResponse("Method not allowed", 405, origin);
}

function extractYouTubeId(input: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v");
  } catch {
    // not a URL
  }
  return null;
}
