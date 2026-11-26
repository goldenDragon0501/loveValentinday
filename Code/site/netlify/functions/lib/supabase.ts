import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseAdmin = createClient(url, serviceKey);
export const supabasePublic = createClient(url, anonKey);

export const CALENDAR_TZ = process.env.CALENDAR_TIMEZONE ?? "America/Puerto_Rico";
export const CALENDAR_OPEN_HOUR = Number(process.env.CALENDAR_OPEN_HOUR ?? 8);
export const CALENDAR_YEAR = Number(process.env.CALENDAR_YEAR ?? 2027);

export function getUnlockTime(dayNumber: number): Date {
  const dateStr = `${CALENDAR_YEAR}-02-${String(dayNumber).padStart(2, "0")}`;
  const hour = String(CALENDAR_OPEN_HOUR).padStart(2, "0");
  const dt = new Date(`${dateStr}T${hour}:00:00`);
  const prOffset = -4 * 60;
  const localOffset = dt.getTimezoneOffset();
  return new Date(dt.getTime() + (localOffset - prOffset) * 60_000);
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
