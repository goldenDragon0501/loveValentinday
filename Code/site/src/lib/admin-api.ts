const API = "/.netlify/functions";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function adminFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: authHeaders(token),
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
  return data as T;
}

export interface DashboardData {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    failedOrders: number;
    totalCustomers: number;
    totalRevenue: string;
    revenueByMethod: Record<string, number>;
  };
  warnings: string[];
  awaitingVerification: OrderRow[];
  recentOrders: OrderRow[];
}

export interface OrderRow {
  id: string;
  reference: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  customer: { name: string; email: string } | { name: string; email: string }[];
  payments?: { id: string; status: string; payment_method: string; amount: number }[];
}

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  created_at: string;
}

export interface RecipeDetail extends RecipeSummary {
  description: string | null;
  preparation_steps: string[] | null;
  baking_instructions: string[] | null;
  notes: string[] | null;
  ingredients: { id: string; group_name: string | null; item: string; sort_order: number }[];
  videos: { id: string; youtube_id: string; title: string; sort_order: number }[];
  downloads: { id: string; file_name: string; file_type: string }[];
}

export interface CalendarDay {
  id: number;
  day_number: number;
  date: string;
  unlock_time: string;
  title: string | null;
  kind: string;
  published: boolean;
  recipe_id: string | null;
  recipe: { id: string; slug: string; title: string; category: string } | null;
}

export interface CustomerSummary {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface CustomerDetail extends CustomerSummary {
  orders: { id: string; reference: string; status: string; total: number; payment_method: string; created_at: string }[];
  access: { id: string; active: boolean; expires_at: string | null; last_accessed_at: string | null; created_at: string; order_id: string }[];
}

export interface SettingRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface SettingsData {
  settings: SettingRow[];
  warnings: string[];
  integrations: Record<string, boolean>;
}

export function getDashboard(token: string) {
  return adminFetch<DashboardData>("/admin-dashboard", token);
}

export function getOrders(token: string, params?: { status?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  return adminFetch<{ orders: OrderRow[]; total: number; page: number; limit: number }>(
    `/admin-orders?${qs}`, token,
  );
}

export function orderAction(token: string, orderId: string, action: string, notes?: string) {
  return adminFetch<{ status: string }>("/admin-orders", token, {
    method: "POST",
    body: JSON.stringify({ orderId, action, notes }),
  });
}

export function getRecipes(token: string) {
  return adminFetch<{ recipes: RecipeSummary[] }>("/admin-recipes", token);
}

export function getRecipe(token: string, id: string) {
  return adminFetch<RecipeDetail>(`/admin-recipes?id=${id}`, token);
}

export function saveRecipe(token: string, data: Record<string, unknown>) {
  return adminFetch<{ id?: string; status?: string }>("/admin-recipes", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCalendar(token: string) {
  return adminFetch<{ days: CalendarDay[]; warnings: string[] }>("/admin-calendar", token);
}

export function updateCalendarDay(token: string, data: Record<string, unknown>) {
  return adminFetch<{ status: string }>("/admin-calendar", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCustomers(token: string, params?: { search?: string; page?: number }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  return adminFetch<{ customers: CustomerSummary[]; total: number; page: number; limit: number }>(
    `/admin-customers?${qs}`, token,
  );
}

export function getCustomer(token: string, id: string) {
  return adminFetch<{ customer: CustomerDetail; orders: CustomerDetail["orders"]; access: CustomerDetail["access"] }>(
    `/admin-customers?id=${id}`, token,
  );
}

export function customerAction(token: string, data: Record<string, unknown>) {
  return adminFetch<{ status: string }>("/admin-customers", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSettings(token: string) {
  return adminFetch<SettingsData>("/admin-settings", token);
}

export function updateSettings(token: string, updates: { key: string; value: unknown }[]) {
  return adminFetch<{ status: string }>("/admin-settings", token, {
    method: "POST",
    body: JSON.stringify({ updates }),
  });
}
