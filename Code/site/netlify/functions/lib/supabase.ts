import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabaseConfigured = url !== PLACEHOLDER_URL && serviceKey !== "placeholder";

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!supabaseConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!_admin) _admin = createClient(url, serviceKey);
  return _admin;
}
function getPublic(): SupabaseClient {
  if (!supabaseConfigured) throw new Error("SUPABASE_NOT_CONFIGURED");
  if (!_public) _public = createClient(url, anonKey);
  return _public;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return Reflect.get(getAdmin(), prop); },
});
export const supabasePublic: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return Reflect.get(getPublic(), prop); },
});

export const CALENDAR_TZ = process.env.CALENDAR_TIMEZONE ?? "America/Puerto_Rico";
export const CALENDAR_OPEN_HOUR = Number(process.env.CALENDAR_OPEN_HOUR ?? 8);
export const CALENDAR_YEAR = Number(process.env.CALENDAR_YEAR ?? 2027);

export function getUnlockTime(dayNumber: number): Date {
  const dateStr = `${CALENDAR_YEAR}-02-${String(dayNumber).padStart(2, "0")}`;
  const hour = String(CALENDAR_OPEN_HOUR).padStart(2, "0");
  return new Date(`${dateStr}T${hour}:00:00-04:00`);
}

export function nowInPR(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: CALENDAR_TZ })
  );
}

export function getUnlockedDays(): number[] {
  const now = Date.now();
  const unlocked: number[] = [];
  for (let d = 1; d <= 14; d++) {
    if (now >= getUnlockTime(d).getTime()) unlocked.push(d);
  }
  return unlocked;
}

export function nextUnlockTime(): Date | null {
  const now = Date.now();
  for (let d = 1; d <= 14; d++) {
    const t = getUnlockTime(d);
    if (t.getTime() > now) return t;
  }
  return null;
}

export function requireSupabase(origin?: string): Response | null {
  if (!supabaseConfigured) {
    return jsonResponse(
      { error: "El servicio no está configurado. Intente más tarde." },
      503,
      origin,
    );
  }
  return null;
}

export function corsHeaders(origin?: string) {
  const allowed = process.env.PUBLIC_URL ?? "https://lovevalentinday.netlify.app";
  return {
    "Access-Control-Allow-Origin": origin?.startsWith("http://localhost") ? origin : allowed,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function jsonResponse(body: unknown, status = 200, origin?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export function errorResponse(message: string, status = 400, origin?: string) {
  return jsonResponse({ error: message }, status, origin);
}
