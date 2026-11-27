"use client";

import { useState, useEffect, useReducer } from "react";
import { supabase } from "@/lib/supabase";
import {
  getDashboard, getOrders, orderAction, getRecipes, getRecipe, saveRecipe,
  getCalendar, updateCalendarDay, getCustomers, getCustomer, customerAction,
  getSettings, updateSettings, registerCustomer, generateAccessLink,
  type DashboardData, type OrderRow, type RecipeSummary, type RecipeDetail,
  type CalendarDay, type CustomerSummary, type SettingsData,
} from "@/lib/admin-api";

type Tab = "resumen" | "clientes" | "recetas" | "calendario" | "config" | "pedidos";
const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "clientes", label: "Clientes" },
  { id: "recetas", label: "Recetas" },
  { id: "calendario", label: "Calendario" },
  { id: "config", label: "Configuración" },
  { id: "pedidos", label: "Pedidos" },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<Tab>("resumen");
  const [msg, setMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setAuthError(error?.message ?? "Login failed");
      return;
    }
    setToken(data.session.access_token);
    setAuthed(true);
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream/30 p-4">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-center font-playfair text-2xl font-bold text-ink">Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3" placeholder="admin@example.com" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3" placeholder="Contraseña" />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit" className="w-full rounded-xl bg-ink py-3 font-bold text-white hover:bg-ink/90 transition-colors">
              Iniciar sesión
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream/30">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <h1 className="font-playfair text-lg font-bold text-ink">Admin · 14 días de dulce amor</h1>
          <button onClick={() => { supabase.auth.signOut(); setAuthed(false); }}
            className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm text-ink/60 hover:bg-ink/5">
            Cerrar sesión
          </button>
        </div>
        <nav className="mx-auto max-w-7xl flex gap-1 px-4 pb-2 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-rose text-white" : "text-ink/60 hover:bg-ink/5"
              }`}>{t.label}</button>
          ))}
        </nav>
      </header>

      {msg && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 flex justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg("")} className="text-green-600 font-bold">×</button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {tab === "resumen" && <ResumenTab token={token} onMsg={setMsg} />}
        {tab === "pedidos" && <PedidosTab token={token} onMsg={setMsg} />}
        {tab === "recetas" && <RecetasTab token={token} onMsg={setMsg} />}
        {tab === "calendario" && <CalendarioTab token={token} onMsg={setMsg} />}
        {tab === "clientes" && <ClientesTab token={token} onMsg={setMsg} />}
        {tab === "config" && <ConfigTab token={token} onMsg={setMsg} />}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    awaiting_verification: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    revoked: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
    refunded: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-rose border-t-transparent" /></div>;
}

function useRefresh() {
  const [v, bump] = useReducer((n: number) => n + 1, 0);
  return [v, bump] as const;
}

function customerName(c: OrderRow["customer"]): string {
  if (Array.isArray(c)) return c[0]?.name ?? "";
  return c?.name ?? "";
}

// ═══════════════ RESUMEN ═══════════════
function ResumenTab({ token, onMsg }: { token: string; onMsg: (m: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ver, refresh] = useRefresh();

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- sync loading before async fetch
    getDashboard(token).then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) onMsg("Error al cargar resumen"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, ver]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner />;
  if (!data) return <p className="text-ink/50">No data</p>;

  return (
    <div className="space-y-6">
      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-1">
          <p className="font-semibold text-gold">Advertencias de configuración</p>
          {data.warnings.map((w, i) => <p key={i} className="text-sm text-ink/70">⚠ {w}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Órdenes", value: data.stats.totalOrders },
          { label: "Pendientes", value: data.stats.pendingOrders },
          { label: "Pagadas", value: data.stats.paidOrders },
          { label: "Fallidas", value: data.stats.failedOrders },
          { label: "Clientes", value: data.stats.totalCustomers },
          { label: "Ingresos", value: `$${data.stats.totalRevenue}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs text-ink/50">{s.label}</p>
            <p className="text-2xl font-bold text-ink mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {Object.keys(data.stats.revenueByMethod).length > 0 && (
        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <p className="font-semibold text-ink mb-2">Ingresos por método</p>
          <div className="flex gap-6">
            {Object.entries(data.stats.revenueByMethod).map(([m, v]) => (
              <div key={m}><span className="text-sm text-ink/50">{m}</span> <span className="font-bold">${v.toFixed(2)}</span></div>
            ))}
          </div>
        </div>
      )}

      {data.awaitingVerification.length > 0 && (
        <div>
          <h2 className="font-playfair text-xl font-bold text-ink mb-3">Pendientes de verificación</h2>
          <div className="space-y-2">
            {data.awaitingVerification.map((o) => (
              <div key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{customerName(o.customer)} — {o.reference}</p>
                  <p className="text-sm text-ink/50">{o.payment_method} · ${o.total} · {new Date(o.created_at).toLocaleDateString("es-PR")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={async () => { await orderAction(token, o.id, "approve"); onMsg("Orden aprobada"); refresh(); }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Aprobar</button>
                  <button onClick={async () => { await orderAction(token, o.id, "reject"); onMsg("Orden rechazada"); refresh(); }}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentOrders.length > 0 && (
        <div>
          <h2 className="font-playfair text-xl font-bold text-ink mb-3">Órdenes recientes</h2>
          <OrdersTable orders={data.recentOrders} />
        </div>
      )}
    </div>
  );
}

function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
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
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-ink/5 last:border-0">
              <td className="p-3 font-mono text-xs">{o.reference}</td>
              <td className="p-3">{customerName(o.customer)}</td>
              <td className="p-3">{o.payment_method}</td>
              <td className="p-3">${o.total}</td>
              <td className="p-3"><StatusBadge status={o.status} /></td>
              <td className="p-3 text-ink/50">{new Date(o.created_at).toLocaleDateString("es-PR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════ PEDIDOS ═══════════════
function PedidosTab({ token, onMsg }: { token: string; onMsg: (m: string) => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [ver, refresh] = useRefresh();

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    getOrders(token, { status: statusFilter || undefined, page })
      .then((d) => { if (!cancelled) { setOrders(d.orders); setTotal(d.total); setPage(d.page); } })
      .catch(() => { if (!cancelled) onMsg("Error al cargar pedidos"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, statusFilter, page, ver]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["", "pending", "awaiting_verification", "paid", "failed"].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-sm ${statusFilter === s ? "bg-rose text-white" : "bg-white border border-ink/10 text-ink/60"}`}>
            {s || "Todos"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <>
          <OrdersTable orders={orders} />
          <div className="flex justify-between items-center text-sm text-ink/50">
            <span>{total} órdenes</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-30">← Anterior</button>
              <button disabled={orders.length < 25} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-30">Siguiente →</button>
            </div>
          </div>

          {orders.filter((o) => o.status === "awaiting_verification").map((o) => (
            <div key={`action-${o.id}`} className="flex gap-2 items-center rounded-xl bg-gold/5 border border-gold/20 p-3">
              <span className="text-sm flex-1">{o.reference} — {customerName(o.customer)}</span>
              <button onClick={async () => { await orderAction(token, o.id, "approve"); onMsg("Aprobada"); refresh(); }}
                className="rounded bg-green-600 px-3 py-1 text-xs text-white font-semibold">Aprobar</button>
              <button onClick={async () => { await orderAction(token, o.id, "reject"); onMsg("Rechazada"); refresh(); }}
                className="rounded bg-red-500 px-3 py-1 text-xs text-white font-semibold">Rechazar</button>
              {o.status === "paid" && (
                <button onClick={async () => { await orderAction(token, o.id, "resend_email"); onMsg("Correo enviado"); }}
                  className="rounded bg-blue-500 px-3 py-1 text-xs text-white font-semibold">Reenviar email</button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ═══════════════ RECETAS ═══════════════
function RecetasTab({ token, onMsg }: { token: string; onMsg: (m: string) => void }) {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [editing, setEditing] = useState<RecipeDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ver, refresh] = useRefresh();

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    getRecipes(token).then((d) => { if (!cancelled) setRecipes(d.recipes); })
      .catch(() => { if (!cancelled) onMsg("Error al cargar recetas"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, ver]); // eslint-disable-line react-hooks/exhaustive-deps

  if (editing || creating) {
    return <RecipeEditor
      token={token} recipe={editing} onMsg={onMsg}
      onDone={() => { setEditing(null); setCreating(false); refresh(); }}
    />;
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-playfair text-xl font-bold text-ink">Recetas ({recipes.length})</h2>
        <button onClick={() => setCreating(true)}
          className="rounded-xl bg-rose px-4 py-2 text-sm font-bold text-white hover:bg-rose/90">+ Nueva receta</button>
      </div>

      <div className="grid gap-3">
        {recipes.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-4">
            <div>
              <p className="font-semibold text-ink">{r.title}</p>
              <p className="text-sm text-ink/50">{r.slug} · {r.category}</p>
            </div>
            <button onClick={async () => setEditing(await getRecipe(token, r.id))}
              className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm text-ink/60 hover:bg-ink/5">Editar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeEditor({ token, recipe, onMsg, onDone }: {
  token: string; recipe: RecipeDetail | null; onMsg: (m: string) => void; onDone: () => void;
}) {
  const isNew = !recipe;
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [slug, setSlug] = useState(recipe?.slug ?? "");
  const [category, setCategory] = useState(recipe?.category ?? "dessert");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [steps, setSteps] = useState<string[]>(recipe?.preparation_steps ?? []);
  const [bake, setBake] = useState<string[]>(recipe?.baking_instructions ?? []);
  const [notes, setNotes] = useState<string[]>(recipe?.notes ?? []);
  const [ingredients, setIngredients] = useState(recipe?.ingredients?.map((i) => ({
    group_name: i.group_name ?? "", item: i.item, sort_order: i.sort_order,
  })) ?? []);
  const [videos, setVideos] = useState(recipe?.videos?.map((v) => ({
    youtube_id: v.youtube_id, title: v.title, sort_order: v.sort_order,
  })) ?? []);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title || !slug) { onMsg("Título y slug son requeridos"); return; }
    setSaving(true);
    try {
      await saveRecipe(token, {
        action: isNew ? "create" : "update",
        ...(recipe?.id ? { id: recipe.id } : {}),
        title, slug, category,
        description: description || null,
        preparation_steps: steps.length ? steps : null,
        baking_instructions: bake.length ? bake : null,
        notes: notes.length ? notes : null,
        ingredients: ingredients.map((i, idx) => ({ ...i, sort_order: idx })),
        videos: videos.map((v, idx) => ({ ...v, sort_order: idx })),
      });
      onMsg(isNew ? "Receta creada" : "Receta actualizada");
      onDone();
    } catch (err) {
      onMsg(err instanceof Error ? err.message : "Error al guardar");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-playfair text-xl font-bold text-ink">{isNew ? "Nueva receta" : "Editar receta"}</h2>
        <button onClick={onDone} className="text-sm text-ink/50 hover:text-ink">← Volver</button>
      </div>

      <div className="grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-ink/60 block mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2" />
          </div>
          <div>
            <label className="text-sm text-ink/60 block mb-1">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2" placeholder="nombre-en-minusculas" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-ink/60 block mb-1">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2">
              <option value="dessert">Postre</option>
              <option value="beverage">Bebida</option>
              <option value="meal">Comida</option>
              <option value="special">Especial</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-ink/60 block mb-1">Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2" />
          </div>
        </div>

        <ArrayField label="Videos de YouTube" items={videos} onUpdate={setVideos}
          renderItem={(v, i) => (
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={v.youtube_id} onChange={(e) => { const n = [...videos]; n[i] = { ...v, youtube_id: e.target.value }; setVideos(n); }}
                className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm" placeholder="ID o URL de YouTube" />
              <input value={v.title} onChange={(e) => { const n = [...videos]; n[i] = { ...v, title: e.target.value }; setVideos(n); }}
                className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm" placeholder="Título del video" />
            </div>
          )}
          newItem={() => ({ youtube_id: "", title: "", sort_order: videos.length })}
        />

        <ArrayField label="Ingredientes" items={ingredients} onUpdate={setIngredients}
          renderItem={(ing, i) => (
            <div className="grid grid-cols-3 gap-2">
              <input value={ing.group_name} onChange={(e) => { const n = [...ingredients]; n[i] = { ...ing, group_name: e.target.value }; setIngredients(n); }}
                className="rounded-lg border border-ink/10 px-3 py-1.5 text-sm" placeholder="Grupo" />
              <input value={ing.item} onChange={(e) => { const n = [...ingredients]; n[i] = { ...ing, item: e.target.value }; setIngredients(n); }}
                className="col-span-2 rounded-lg border border-ink/10 px-3 py-1.5 text-sm" placeholder="Ingrediente" />
            </div>
          )}
          newItem={() => ({ group_name: "", item: "", sort_order: ingredients.length })}
        />

        <StringArrayField label="Pasos de preparación" items={steps} onUpdate={setSteps} />
        <StringArrayField label="Instrucciones de horneo" items={bake} onUpdate={setBake} />
        <StringArrayField label="Notas" items={notes} onUpdate={setNotes} />
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="rounded-xl bg-rose px-6 py-3 font-bold text-white hover:bg-rose/90 disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={onDone} className="rounded-xl border border-ink/10 px-6 py-3 text-ink/60">Cancelar</button>
      </div>
    </div>
  );
}

function ArrayField<T>({ label, items, onUpdate, renderItem, newItem }: {
  label: string; items: T[]; onUpdate: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode; newItem: () => T;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-ink/60">{label}</label>
        <button onClick={() => onUpdate([...items, newItem()])} className="text-xs text-rose hover:underline">+ Añadir</button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">{renderItem(item, i)}</div>
            <button onClick={() => onUpdate(items.filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-600 text-sm mt-1">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StringArrayField({ label, items, onUpdate }: {
  label: string; items: string[]; onUpdate: (items: string[]) => void;
}) {
  return (
    <ArrayField label={label} items={items} onUpdate={onUpdate}
      renderItem={(item, i) => (
        <textarea value={item} onChange={(e) => { const n = [...items]; n[i] = e.target.value; onUpdate(n); }}
          className="w-full rounded-lg border border-ink/10 px-3 py-1.5 text-sm resize-none" rows={2} />
      )}
      newItem={() => ""}
    />
  );
}

// ═══════════════ CALENDARIO ═══════════════
function CalendarioTab({ token, onMsg }: { token: string; onMsg: (m: string) => void }) {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [ver, refresh] = useRefresh();

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    Promise.all([getCalendar(token), getRecipes(token)])
      .then(([cal, rec]) => { if (!cancelled) { setDays(cal.days); setWarnings(cal.warnings); setRecipes(rec.recipes); } })
      .catch(() => { if (!cancelled) onMsg("Error al cargar calendario"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, ver]); // eslint-disable-line react-hooks/exhaustive-deps

  async function assignRecipe(dayNumber: number, recipeId: string | null) {
    try {
      await updateCalendarDay(token, { action: "update", dayNumber, recipeId });
      onMsg(`Día ${dayNumber} actualizado`);
      refresh();
    } catch (err) { onMsg(err instanceof Error ? err.message : "Error"); }
  }

  async function togglePublished(dayNumber: number, published: boolean) {
    try {
      await updateCalendarDay(token, { action: "update", dayNumber, published });
      refresh();
    } catch (err) { onMsg(err instanceof Error ? err.message : "Error"); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-1">
          {warnings.map((w, i) => <p key={i} className="text-sm text-ink/70">⚠ {w}</p>)}
        </div>
      )}

      <div className="grid gap-3">
        {days.map((day) => (
          <div key={day.day_number} className={`rounded-2xl border p-4 ${day.recipe_id ? "border-ink/10 bg-white" : "border-gold/30 bg-gold/5"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose/10 font-bold text-rose">
                  {day.day_number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink truncate">{day.title ?? day.recipe?.title ?? "Sin receta"}</p>
                  <p className="text-xs text-ink/50">{day.date} · {day.kind}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select value={day.recipe_id ?? ""}
                  onChange={(e) => assignRecipe(day.day_number, e.target.value || null)}
                  className="rounded-lg border border-ink/10 px-2 py-1 text-sm max-w-[200px]">
                  <option value="">Sin receta</option>
                  {recipes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>

                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={day.published}
                    onChange={(e) => togglePublished(day.day_number, e.target.checked)}
                    className="rounded" />
                  <span className="text-ink/50">Pub</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════ CLIENTES ═══════════════
function ClientesTab({ token, onMsg }: { token: string; onMsg: (m: string) => void }) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getCustomer>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [ver, refresh] = useRefresh();
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regNotes, setRegNotes] = useState("");
  const [registering, setRegistering] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    getCustomers(token, { search: search || undefined, page })
      .then((d) => { if (!cancelled) { setCustomers(d.customers); setTotal(d.total); setPage(d.page); } })
      .catch(() => { if (!cancelled) onMsg("Error al cargar clientes"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, search, page, ver]); // eslint-disable-line react-hooks/exhaustive-deps

  async function selectCustomer(id: string) {
    try {
      setDetail(await getCustomer(token, id));
      setSelected(id);
      setGeneratedLink(null);
      setCopied(false);
    } catch { onMsg("Error al cargar cliente"); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await registerCustomer(token, { name: regName, email: regEmail, notes: regNotes || undefined });
      setGeneratedLink(res.accessUrl);
      setCopied(false);
      onMsg(res.existed ? `Cliente existente — nuevo enlace generado` : `Cliente registrado exitosamente`);
      setRegName("");
      setRegEmail("");
      setRegNotes("");
      setShowRegister(false);
      refresh();
      selectCustomer(res.customerId);
    } catch (err) {
      onMsg(err instanceof Error ? err.message : "Error al registrar");
    }
    setRegistering(false);
  }

  async function handleGenerateLink(customerId: string) {
    try {
      const res = await generateAccessLink(token, customerId);
      setGeneratedLink(res.accessUrl);
      setCopied(false);
      onMsg("Nuevo enlace generado");
      selectCustomer(customerId);
    } catch (err) {
      onMsg(err instanceof Error ? err.message : "Error al generar enlace");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  if (selected && detail) {
    const activeAccess = detail.access.find((a) => a.active);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const activeAccessUrl = activeAccess?.access_token
      ? `${baseUrl}/calendario/?token=${activeAccess.access_token}`
      : null;
    const displayUrl = generatedLink ?? activeAccessUrl;

    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setDetail(null); setGeneratedLink(null); }} className="text-sm text-ink/50 hover:text-ink">← Volver</button>

        <div className="rounded-2xl border border-ink/10 bg-white p-4">
          <h3 className="font-semibold text-ink">{detail.customer.name}</h3>
          <p className="text-sm text-ink/50">{detail.customer.email}</p>
        </div>

        {displayUrl && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-3">
            <h4 className="font-semibold text-green-800">Enlace de acceso</h4>
            <div className="flex items-center gap-2">
              <input readOnly value={displayUrl}
                className="flex-1 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-mono text-ink/80 select-all" />
              <button onClick={() => copyToClipboard(displayUrl)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${copied ? "bg-green-600" : "bg-rose hover:bg-rose/90"}`}>
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="text-xs text-green-700">Comparte este enlace con el cliente para que acceda al calendario.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleGenerateLink(selected)}
            className="rounded-xl bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose/90">
            Generar nuevo enlace
          </button>
          <button onClick={async () => {
            await customerAction(token, { action: "resend_access", customerId: selected });
            onMsg("Correo enviado");
          }} className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 hover:bg-ink/5">
            Enviar por correo
          </button>
        </div>

        {detail.access.length > 0 && (
          <div>
            <h4 className="font-semibold text-ink mb-2">Historial de acceso</h4>
            {detail.access.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-3 mb-2">
                <StatusBadge status={a.active ? "active" : "revoked"} />
                <div className="flex-1 text-sm text-ink/50">
                  <span>Último acceso: {a.last_accessed_at ? new Date(a.last_accessed_at).toLocaleDateString("es-PR") : "nunca"}</span>
                  {(a as Record<string, unknown>).grant_type === "manual" && <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">Manual</span>}
                </div>
                <button onClick={async () => {
                  await customerAction(token, { action: a.active ? "revoke_access" : "activate_access", accessId: a.id });
                  onMsg(a.active ? "Acceso revocado" : "Acceso activado");
                  selectCustomer(selected);
                }} className={`rounded px-3 py-1 text-xs text-white font-semibold ${a.active ? "bg-red-500" : "bg-green-600"}`}>
                  {a.active ? "Revocar" : "Activar"}
                </button>
              </div>
            ))}
          </div>
        )}

        {detail.orders.length > 0 && (
          <div>
            <h4 className="font-semibold text-ink mb-2">Historial de compras</h4>
            <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead><tr>
                  <th className="p-3 text-ink/60">Ref</th><th className="p-3 text-ink/60">Total</th>
                  <th className="p-3 text-ink/60">Método</th><th className="p-3 text-ink/60">Estado</th>
                  <th className="p-3 text-ink/60">Fecha</th>
                </tr></thead>
                <tbody>
                  {detail.orders.map((o) => (
                    <tr key={o.id} className="border-t border-ink/5">
                      <td className="p-3 font-mono text-xs">{o.reference}</td>
                      <td className="p-3">${o.total}</td>
                      <td className="p-3">{o.payment_method}</td>
                      <td className="p-3"><StatusBadge status={o.status} /></td>
                      <td className="p-3 text-ink/50">{new Date(o.created_at).toLocaleDateString("es-PR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email..."
          className="flex-1 min-w-[200px] rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm" />
        <button onClick={() => { setPage(1); refresh(); }} className="rounded-xl bg-ink px-4 py-2 text-sm text-white font-semibold">Buscar</button>
        <button onClick={() => setShowRegister(!showRegister)}
          className="rounded-xl bg-rose px-4 py-2 text-sm text-white font-semibold hover:bg-rose/90">
          + Registrar cliente
        </button>
      </div>

      {showRegister && (
        <form onSubmit={handleRegister} className="rounded-2xl border border-rose/20 bg-rose/5 p-4 space-y-3">
          <h3 className="font-semibold text-ink">Registrar nuevo cliente</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={regName} onChange={(e) => setRegName(e.target.value)} required minLength={2}
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm" placeholder="Nombre del cliente" />
            <input value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required type="email"
              className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm" placeholder="correo@ejemplo.com" />
          </div>
          <input value={regNotes} onChange={(e) => setRegNotes(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm" placeholder="Notas (opcional)" />
          <div className="flex gap-3">
            <button type="submit" disabled={registering}
              className="rounded-xl bg-rose px-6 py-2 text-sm font-bold text-white hover:bg-rose/90 disabled:opacity-50">
              {registering ? "Registrando..." : "Registrar y generar enlace"}
            </button>
            <button type="button" onClick={() => setShowRegister(false)}
              className="rounded-xl border border-ink/10 px-4 py-2 text-sm text-ink/60">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? <Spinner /> : (
        <>
          <div className="grid gap-2">
            {customers.map((c) => (
              <button key={c.id} onClick={() => selectCustomer(c.id)}
                className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-3 text-left hover:border-rose/30">
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-ink/50">{c.email}</p>
                </div>
                <span className="text-xs text-ink/40">{new Date(c.created_at).toLocaleDateString("es-PR")}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-ink/50">
            <span>{total} clientes</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 disabled:opacity-30">←</button>
              <button disabled={customers.length < 25} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 disabled:opacity-30">→</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════ CONFIGURACIÓN ═══════════════
function ConfigTab({ token, onMsg }: { token: string; onMsg: (m: string) => void }) {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changes, setChanges] = useState<Record<string, unknown>>({});
  const [ver, refresh] = useRefresh();

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    getSettings(token)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) onMsg("Error al cargar configuración"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, ver]); // eslint-disable-line react-hooks/exhaustive-deps

  function getValue(key: string): unknown {
    if (key in changes) return changes[key];
    const s = data?.settings.find((s) => s.key === key);
    return s?.value;
  }

  function set(key: string, value: unknown) {
    setChanges({ ...changes, [key]: value });
  }

  async function handleSave() {
    const updates = Object.entries(changes).map(([key, value]) => ({ key, value }));
    if (!updates.length) return;
    try {
      await updateSettings(token, updates);
      onMsg("Configuración guardada");
      setChanges({});
      refresh();
    } catch (err) { onMsg(err instanceof Error ? err.message : "Error al guardar"); }
  }

  if (loading) return <Spinner />;
  if (!data) return null;

  const priceCents = getValue("product_price_cents") as number ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-1">
          {data.warnings.map((w, i) => <p key={i} className="text-sm text-ink/70">⚠ {w}</p>)}
        </div>
      )}

      <section className="rounded-2xl border border-ink/10 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-ink">Producto y ventas</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-ink/60 block mb-1">Precio (USD)</label>
            <input type="number" step="0.01" min="0" value={(priceCents / 100).toFixed(2)}
              onChange={(e) => set("product_price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
              className="w-full rounded-xl border border-ink/10 px-4 py-2" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={getValue("sales_enabled") === true}
                onChange={(e) => set("sales_enabled", e.target.checked)} className="rounded" />
              <span className="text-sm text-ink">Ventas activadas</span>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-5 space-y-4">
        <h3 className="font-semibold text-ink">Modelo de ventas</h3>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <p className="font-semibold">Ventas manuales activas</p>
          <p className="mt-1 text-blue-700">
            Los clientes te contactan directamente para comprar. Registra cada cliente
            en la pestaña Clientes y comparte el enlace de acceso generado.
          </p>
        </div>
      </section>

      {Object.keys(changes).length > 0 && (
        <div className="sticky bottom-4 flex gap-3">
          <button onClick={handleSave}
            className="rounded-xl bg-rose px-6 py-3 font-bold text-white hover:bg-rose/90 shadow-lg">
            Guardar cambios
          </button>
          <button onClick={() => setChanges({})}
            className="rounded-xl border border-ink/10 px-6 py-3 text-ink/60">Descartar</button>
        </div>
      )}
    </div>
  );
}
