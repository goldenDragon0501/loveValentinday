const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }

  return data as T;
}

export interface CalendarStatus {
  serverTime: string;
  prTime: string;
  calendarStart: string;
  calendarEnd: string;
  started: boolean;
  ended: boolean;
  unlockedDays: number[];
  nextUnlock: string | null;
  totalDays: number;
}

export function getCalendarStatus() {
  return apiFetch<CalendarStatus>("/calendar-status");
}

export interface DayContent {
  day: {
    dayNumber: number;
    date: string;
    title: string;
    kind: string;
    specialContent: Record<string, unknown> | null;
  };
  recipe: {
    slug: string;
    title: string;
    category: string;
    description: string | null;
    preparation_steps: string[] | null;
    baking_instructions: string[] | null;
    notes: string[] | null;
    ingredients: { group_name: string | null; item: string; sort_order: number }[];
    videos: { youtube_id: string; title: string; sort_order: number }[];
    downloads: { file_name: string; file_type: string }[];
  } | null;
}

export function getDayContent(day: number, token: string) {
  return apiFetch<DayContent>(`/day-content?day=${day}&token=${encodeURIComponent(token)}`);
}

export interface VerifyAccessResult {
  valid: boolean;
  customer: { name: string; email: string };
  order: { reference: string; status: string; paymentMethod: string };
}

export function verifyAccess(token: string) {
  return apiFetch<VerifyAccessResult>("/verify-access", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

// Phase 9: checkout, createPayPalOrder, capturePayPalOrder removed — manual sales model active

export function recoverAccess(email: string) {
  return apiFetch<{ message: string }>("/recover-access", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
