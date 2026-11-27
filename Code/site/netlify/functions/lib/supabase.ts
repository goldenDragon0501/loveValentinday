import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../../worker/env";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";

export function supabaseConfigured(): boolean {
  const url = env("NEXT_PUBLIC_SUPABASE_URL") || PLACEHOLDER_URL;
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY") || "placeholder";
  return url !== PLACEHOLDER_URL && serviceKey !== "placeholder";
}

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;
let _adminUrl = "";
let _publicUrl = "";

function getAdmin(): SupabaseClient {
  if (!supabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
  const key = env("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!_admin || _adminUrl !== url) {
    _adminUrl = url;
    _admin = createClient(url, key);
  }
  return _admin;
}
function getPublic(): SupabaseClient {
  if (!supabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
  const key = env("NEXT_PUBLIC_SUPABASE_ANON_KEY") || "placeholder";
  if (!_public || _publicUrl !== url) {
    _publicUrl = url;
    _public = createClient(url, key);
  }
  return _public;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return Reflect.get(getAdmin(), prop); },
});
export const supabasePublic: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) { return Reflect.get(getPublic(), prop); },
});

export function getCalendarTz(): string {
  return env("CALENDAR_TIMEZONE") ?? "America/Puerto_Rico";
}
export function getCalendarOpenHour(): number {
  return Number(env("CALENDAR_OPEN_HOUR") ?? 8);
}
export function getCalendarYear(): number {
  return Number(env("CALENDAR_YEAR") ?? 2027);
}

export function getUnlockTime(dayNumber: number): Date {
  const year = getCalendarYear();
  const hour = getCalendarOpenHour();
  const dateStr = `${year}-02-${String(dayNumber).padStart(2, "0")}`;
  const hourStr = String(hour).padStart(2, "0");
  return new Date(`${dateStr}T${hourStr}:00:00-04:00`);
}

export function nowInPR(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: getCalendarTz() })
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
  if (!supabaseConfigured()) {
    return jsonResponse(
      { error: "El servicio no está configurado. Intente más tarde." },
      503,
      origin,
    );
  }
  return null;
}

export function corsHeaders(origin?: string) {
  const allowed = env("PUBLIC_URL") ?? "https://lovevalentinday.shainiranasinghe57.workers.dev";
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
