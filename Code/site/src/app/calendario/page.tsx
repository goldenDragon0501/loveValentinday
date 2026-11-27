"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  verifyAccess,
  getCalendarStatus,
  getDayContent,
  recoverAccess,
} from "@/lib/api";
import type { CalendarStatus, DayContent, VerifyAccessResult } from "@/lib/api";
import { day14Plan } from "@/content/site";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const t = params.get("token") ?? localStorage.getItem("dda_token");
  if (t) localStorage.setItem("dda_token", t);
  return t;
}

function useToken() {
  const [token] = useState(getStoredToken);
  return token;
}

function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await recoverAccess(email);
      setSent(true);
    } catch {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">📧</div>
        <h2 className="font-playfair text-2xl font-bold text-ink">
          ¡Revisa tu correo!
        </h2>
        <p className="text-ink/60">
          Si tienes una compra activa, recibirás un enlace de acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 space-y-6 text-center">
      <h1 className="font-playfair text-3xl font-bold text-ink">
        Accede a tu calendario
      </h1>
      <p className="text-ink/60">
        Ingresa tu correo electrónico para recibir tu enlace de acceso.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink focus:border-rose focus:ring-2 focus:ring-rose/30 outline-none"
          placeholder="tu@correo.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose py-3 font-bold text-white hover:bg-rose/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Recuperar acceso"}
        </button>
      </form>
      <p className="text-sm text-ink/40">
        ¿No tienes el calendario?{" "}
        <a href="/comprar/" className="text-rose underline">
          Consíguelo aquí
        </a>
      </p>
    </div>
  );
}

function DayCard({
  day,
  unlocked,
  selected,
  onSelect,
}: {
  day: number;
  unlocked: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 transition-all ${
        selected
          ? "border-rose bg-rose/10 ring-2 ring-rose/40 scale-105"
          : unlocked
          ? "border-ink/10 bg-white hover:border-rose/40 hover:shadow-md cursor-pointer"
          : "border-ink/5 bg-ink/3 opacity-50 cursor-not-allowed"
      }`}
    >
      <span className="text-xs font-medium text-ink/40 uppercase">Feb</span>
      <span className={`text-2xl font-bold ${selected ? "text-rose" : unlocked ? "text-ink" : "text-ink/30"}`}>
        {day}
      </span>
      {!unlocked && (
        <span className="absolute top-1.5 right-1.5 text-xs">🔒</span>
      )}
      {unlocked && (
        <span className="absolute top-1.5 right-1.5 text-xs">💕</span>
      )}
    </button>
  );
}

function RecipeView({ content }: { content: DayContent }) {
  const { day, recipe } = content;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-2xl font-bold text-ink">
          Día {day.dayNumber}: {day.title ?? recipe?.title}
        </h2>
        {day.kind === "special" && (
          <span className="inline-block mt-2 rounded-full bg-gold/20 px-3 py-1 text-sm font-semibold text-gold">
            Cierre especial
          </span>
        )}
      </div>

      {recipe && (
        <>
          {recipe.videos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-playfair text-lg font-bold text-ink">Videos</h3>
              {recipe.videos.map((v) => (
                <div key={v.youtube_id} className="aspect-video rounded-2xl overflow-hidden bg-ink/5">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          )}

          {recipe.ingredients.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-playfair text-lg font-bold text-ink">Ingredientes</h3>
              {groupIngredients(recipe.ingredients).map(([group, items]) => (
                <div key={group ?? "default"}>
                  {group && (
                    <h4 className="font-semibold text-ink/80 mt-3 mb-1">{group}</h4>
                  )}
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-ink/70">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {recipe.preparation_steps && recipe.preparation_steps.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-playfair text-lg font-bold text-ink">Preparación</h3>
              <ol className="space-y-3">
                {recipe.preparation_steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose/10 text-sm font-bold text-rose">
                      {i + 1}
                    </span>
                    <span className="text-ink/70 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {recipe.baking_instructions && recipe.baking_instructions.length > 0 && (
            <div className="rounded-xl bg-cream/50 p-4 space-y-2">
              <h4 className="font-semibold text-ink/80">Horneado</h4>
              {recipe.baking_instructions.map((inst, i) => (
                <p key={i} className="text-ink/70 text-sm">{inst}</p>
              ))}
            </div>
          )}

          {recipe.notes && recipe.notes.length > 0 && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-2">
              <h4 className="font-semibold text-gold">Notas</h4>
              {recipe.notes.map((note, i) => (
                <p key={i} className="text-ink/70 text-sm">{note}</p>
              ))}
            </div>
          )}

          {recipe.downloads.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-playfair text-lg font-bold text-ink">Descargas</h3>
              {recipe.downloads.map((dl) => (
                <a
                  key={dl.file_name}
                  href="#"
                  className="flex items-center gap-2 rounded-xl border border-ink/10 p-3 hover:border-rose/40 transition-colors"
                >
                  <span className="text-lg">📄</span>
                  <span className="text-ink/70">{dl.file_name}</span>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      {day.dayNumber === 14 && (
        <div className="mt-8 rounded-2xl border-2 border-rose/20 bg-gradient-to-br from-rose/5 to-gold/5 p-6 space-y-4">
          <h3 className="font-playfair text-xl font-bold text-ink">{day14Plan.title}</h3>
          <p className="text-ink/60">{day14Plan.intro}</p>
          <ol className="space-y-3">
            {day14Plan.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose/10 text-sm font-bold text-rose">
                  {i + 1}
                </span>
                <span className="text-ink/70 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-center text-sm font-semibold text-rose mt-4">
            ¡Feliz San Valentín! 💕
          </p>
        </div>
      )}
    </div>
  );
}

function groupIngredients(
  ingredients: { group_name: string | null; item: string; sort_order: number }[]
): [string | null, string[]][] {
  const map = new Map<string | null, string[]>();
  for (const ing of ingredients) {
    const group = ing.group_name;
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(ing.item);
  }
  return Array.from(map.entries());
}

export default function CalendarioPage() {
  const token = useToken();
  const router = useRouter();
  const [customer, setCustomer] = useState<VerifyAccessResult | null>(null);
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayContent, setDayContent] = useState<DayContent | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState("");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current || !token) return;
    didRun.current = true;

    Promise.all([verifyAccess(token), getCalendarStatus()])
      .then(([access, status]) => {
        setCustomer(access);
        setCalendar(status);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error de acceso");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const loadDay = useCallback(
    async (day: number) => {
      if (!token) return;
      setSelectedDay(day);
      setContentLoading(true);
      setDayContent(null);
      try {
        const content = await getDayContent(day, token);
        setDayContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el día");
      }
      setContentLoading(false);
    },
    [token]
  );

  if (!token && !loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 px-4">
          <RecoveryForm />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="mx-auto max-w-3xl">
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-rose border-t-transparent" />
              <p className="mt-4 text-ink/60">Verificando acceso...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-16 space-y-4">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => {
                  localStorage.removeItem("dda_token");
                  router.push("/calendario/");
                }}
                className="text-rose underline"
              >
                Intentar con otro enlace
              </button>
            </div>
          )}

          {customer && calendar && !error && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-playfair text-3xl font-bold text-ink">
                  ¡Hola, {customer.customer.name}! 💕
                </h1>
                <p className="text-ink/60 mt-1">Tu calendario de 14 días de dulce amor</p>
              </div>

              <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-10">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((day) => (
                  <DayCard
                    key={day}
                    day={day}
                    unlocked={calendar.unlockedDays.includes(day)}
                    selected={selectedDay === day}
                    onSelect={() => loadDay(day)}
                  />
                ))}
              </div>

              {contentLoading && (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-rose border-t-transparent" />
                </div>
              )}

              {dayContent && !contentLoading && (
                <div className="rounded-2xl border border-ink/10 bg-white p-6 sm:p-8">
                  <RecipeView content={dayContent} />
                </div>
              )}

              {!selectedDay && !contentLoading && (
                <div className="text-center py-8 text-ink/40">
                  Selecciona un día desbloqueado para ver su contenido
                </div>
              )}

              {calendar.nextUnlock && (
                <p className="text-center text-sm text-ink/40 mt-6">
                  Próximo día: {new Date(calendar.nextUnlock).toLocaleDateString("es-PR", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Puerto_Rico",
                  })}
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
