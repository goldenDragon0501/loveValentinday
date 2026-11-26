import type { Context } from "@netlify/functions";
import { corsHeaders, errorResponse, getUnlockedDays, jsonResponse, nextUnlockTime, nowInPR, CALENDAR_YEAR } from "./lib/supabase";

export default async function handler(req: Request, _context: Context) {
  const origin = req.headers.get("origin") ?? undefined;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405, origin);
  }

  const now = new Date();
  const prNow = nowInPR();
  const unlocked = getUnlockedDays();
  const nextUnlock = nextUnlockTime();

  const calendarStart = new Date(`${CALENDAR_YEAR}-02-01T08:00:00-04:00`);
  const calendarEnd = new Date(`${CALENDAR_YEAR}-02-14T08:00:00-04:00`);

  const started = now.getTime() >= calendarStart.getTime();
  const ended = now.getTime() >= calendarEnd.getTime() + 24 * 60 * 60 * 1000;

  return jsonResponse({
    serverTime: now.toISOString(),
    prTime: prNow.toISOString(),
    calendarStart: calendarStart.toISOString(),
    calendarEnd: calendarEnd.toISOString(),
    started,
    ended,
    unlockedDays: unlocked,
    nextUnlock: nextUnlock?.toISOString() ?? null,
    totalDays: 14,
  }, 200, origin);
}
