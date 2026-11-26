const API_BASE = "/.netlify/functions";

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

export interface CheckoutResult {
  order: {
    id: string;
    reference: string;
    total: number;
    currency: string;
    status: string;
    paymentMethod: string;
  };
  zelle?: {
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    instructions: string;
  };
}

export function checkout(email: string, name: string, paymentMethod: string) {
  return apiFetch<CheckoutResult>("/checkout", {
    method: "POST",
    body: JSON.stringify({ email, name, paymentMethod }),
  });
}

export function createPayPalOrder(orderId: string) {
  return apiFetch<{ paypalOrderId: string }>("/paypal-create", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

export function capturePayPalOrder(paypalOrderId: string) {
  return apiFetch<{ status: string; accessToken?: string; accessUrl?: string }>("/paypal-capture", {
    method: "POST",
    body: JSON.stringify({ paypalOrderId }),
  });
}

export function recoverAccess(email: string) {
  return apiFetch<{ message: string }>("/recover-access", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
