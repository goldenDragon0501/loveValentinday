"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalCustomers: number;
}

interface OrderRow {
  id: string;
  reference: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  customer: { name: string; email: string };
}

const API_BASE = "/.netlify/functions";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState("");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState<OrderRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setAuthError(error?.message ?? "Login failed");
      return;
    }
    const accessToken = data.session.access_token;
    setToken(accessToken);
    setAuthed(true);
    fetchDashboard(accessToken);
  }

  async function fetchDashboard(bearerToken: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin-dashboard`, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();
      setStats(data.stats);
      setAwaitingVerification(data.awaitingVerification);
      setRecentOrders(data.recentOrders);
    } catch {
      setAuthError("Session expired. Please log in again.");
      setAuthed(false);
    }
    setLoading(false);
  }

  async function handleAction(orderId: string, action: "approve" | "reject") {
    setActionMsg("");
    try {
      const res = await fetch(`${API_BASE}/admin-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMsg(`Order ${action === "approve" ? "approved" : "rejected"} successfully`);
      fetchDashboard(token);
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Action failed");
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream/30 p-4">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-center font-playfair text-2xl font-bold text-ink">Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3"
              placeholder="admin@example.com"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3"
              placeholder="Password"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-ink py-3 font-bold text-white hover:bg-ink/90 transition-colors"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream/30 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-2xl font-bold text-ink">Dashboard</h1>
          <button
            onClick={() => { supabase.auth.signOut(); setAuthed(false); }}
            className="rounded-lg border border-ink/10 px-4 py-2 text-sm text-ink/60 hover:bg-ink/5"
          >
            Cerrar sesión
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-rose border-t-transparent" />
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Órdenes totales", value: stats.totalOrders },
              { label: "Pendientes", value: stats.pendingOrders },
              { label: "Pagadas", value: stats.paidOrders },
              { label: "Clientes", value: stats.totalCustomers },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-ink/10 bg-white p-5">
                <p className="text-sm text-ink/50">{s.label}</p>
                <p className="text-3xl font-bold text-ink mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {actionMsg && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {actionMsg}
          </div>
        )}

        {awaitingVerification.length > 0 && (
          <section>
            <h2 className="font-playfair text-xl font-bold text-ink mb-4">
              Pendientes de verificación ({awaitingVerification.length})
            </h2>
            <div className="space-y-3">
              {awaitingVerification.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {o.customer?.name} — {o.reference}
                    </p>
                    <p className="text-sm text-ink/50">
                      {o.payment_method} · ${o.total} ·{" "}
                      {new Date(o.created_at).toLocaleDateString("es-PR")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(o.id, "approve")}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleAction(o.id, "reject")}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {recentOrders.length > 0 && (
          <section>
            <h2 className="font-playfair text-xl font-bold text-ink mb-4">Órdenes recientes</h2>
            <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/5">
                  <tr>
                    <th className="p-3 font-semibold text-ink/60">Ref</th>
                    <th className="p-3 font-semibold text-ink/60">Cliente</th>
                    <th className="p-3 font-semibold text-ink/60">Método</th>
                    <th className="p-3 font-semibold text-ink/60">Total</th>
                    <th className="p-3 font-semibold text-ink/60">Estado</th>
                    <th className="p-3 font-semibold text-ink/60">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-ink/5 last:border-0">
                      <td className="p-3 font-mono text-xs">{o.reference}</td>
                      <td className="p-3">{o.customer?.name}</td>
                      <td className="p-3">{o.payment_method}</td>
                      <td className="p-3">${o.total}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            o.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : o.status === "pending" || o.status === "awaiting_verification"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-ink/50">
                        {new Date(o.created_at).toLocaleDateString("es-PR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
