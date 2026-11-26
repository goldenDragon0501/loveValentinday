"use client";

import { schedule, site } from "@/content/site";
import { label, N, requestOpenDay, useDayState } from "./days";
import { ArchEdge } from "./Edges";
import { Icon3D } from "./Assets";
import { Icon } from "./Icons";
import { Eyebrow, Reveal } from "./ui";

/** The demo's "ruta del amor": the 14 days along a satin ribbon, each one a ticket that opens its day. */
export function Route() {
  const { state } = useDayState();
  return (
    <section id="ruta" className="tex-paper relative bg-bg py-24 sm:py-28">
      <ArchEdge color="var(--c-bg)" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-6 top-[20%] text-5xl opacity-10 anim-drift" style={{ "--dur": "10s", "--delay": "0s" } as React.CSSProperties}>💝</span>
        <span className="absolute right-[4%] top-[40%] text-3xl opacity-15 anim-float" style={{ "--dur": "7s", "--delay": "2s" } as React.CSSProperties}>🌹</span>
        <span className="absolute left-[8%] bottom-[8%] text-4xl opacity-10 anim-sway" style={{ "--dur": "9s", "--delay": "1s" } as React.CSSProperties}>✨</span>
        <span className="absolute right-[6%] bottom-[25%] text-5xl opacity-8 anim-drift" style={{ "--dur": "12s", "--delay": "3s" } as React.CSSProperties}>🎂</span>
      </div>
      <div className="mx-auto max-w-6xl px-5">
        <div className="text-center">
          <Reveal><Eyebrow icon="ticket" className="justify-center anim-shimmer">Tu ruta del amor</Eyebrow></Reveal>
          <Reveal as="h2" delay={0.08} className="mt-4 font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-bold leading-[1.03]">
            Un día nuevo, <span className="font-script font-normal text-water">una receta nueva</span>
          </Reveal>
          <Reveal as="p" delay={0.16} className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Así se ve tu febrero: cada mañana a las {site.openTime} se abre un corazón con su receta. Toca un día para verlo.
          </Reveal>
        </div>

        <ol className="relative mt-16">
          <span aria-hidden className="route-line left-[21px] md:left-1/2 md:-translate-x-1/2" />
          {Array.from({ length: N }, (_, i) => i + 1).map((n) => {
            const st = state(n);
            const right = n % 2 === 0;
            const day = schedule[n - 1];
            const special = day.kind === "special";
            const plan = day.kind === "plan";
            // Pedro sends the order of the recipes later; until then the recipe is revealed on its day.
            const title = day.title ?? "Receta del día";
            return (
              <li key={n} className="relative grid grid-cols-[52px_minmax(0,1fr)] items-center gap-4 py-3 md:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] md:gap-6">
                {/* Node on the ribbon */}
                <span className={`relative z-10 col-start-1 row-start-1 grid size-[52px] place-items-center md:col-start-2 md:mx-auto ${st === "locked" ? "text-muted" : "text-rose"}`} style={{ animation: `dot-pop 0.5s var(--ease-spring) ${n * 0.1}s backwards${st !== "locked" ? ", heart-beat 3s ease-in-out 1s infinite" : ""}` }}>
                  <svg viewBox="0 0 48 48" className="absolute inset-0 size-full drop" aria-hidden>
                    <path d="M24 43C11 34 4 26 4 18 4 11 9 6 15.5 6c3.7 0 6.8 2 8.5 5 1.7-3 4.8-5 8.5-5C39 6 44 11 44 18c0 8-7 16-20 25Z" fill={st === "locked" ? "var(--c-surface)" : st === "preview" ? "var(--c-gold)" : "currentColor"} stroke={st === "locked" ? "var(--c-line)" : "#fff"} strokeWidth="2.5" />
                  </svg>
                  <span className={`relative pb-1 font-display text-lg font-extrabold ${st === "locked" ? "text-muted" : st === "preview" ? "text-wine" : "text-white"}`}>{n}</span>
                </span>

                {/* Ticket */}
                <Reveal
                  variant={right ? "right" : "left"}
                  className={`col-start-2 row-start-1 ${right ? "md:col-start-3" : "md:col-start-1"}`}
                >
                  <button
                    type="button"
                    onClick={() => requestOpenDay(n)}
                    aria-label={`Día ${n}, ${label(n)}: ${title}. ${st === "locked" ? "Bloqueado" : st === "preview" ? "Vista previa" : "Disponible"}`}
                    className={`group block w-full rounded-[22px] text-left ${right ? "" : "md:text-right"}`}
                  >
                    {/* The ticket lifts inside the button, so the hit area stays put under the pointer. */}
                    <span className={`ticket block px-4 py-4 transition duration-500 ease-[var(--ease-soft)] lift sm:px-7 sm:py-5 ${st === "locked" ? "" : "group-hover:-translate-y-2 group-hover:shadow-[0_24px_48px_-16px_rgb(233_30_99_/0.3)]"}`} style={{ animation: `pop-in 0.6s var(--ease-soft) ${n * 0.08}s backwards` }}>
                    <span className={`flex flex-wrap items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] ${right ? "" : "md:justify-end"} ${st === "locked" ? "text-muted" : "text-rose-ink"}`}>
                      <span className="first-letter:uppercase">{label(n)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2 font-display text-xl font-bold leading-snug text-ink sm:text-2xl md:inline-flex">
                      {st === "locked" && <Icon3D name="lock" className="size-7 shrink-0" />}
                      {title}
                    </span>
                    <span className={`mt-3 flex flex-wrap items-center gap-2 ${right ? "" : "md:justify-end"}`}>
                      {special ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-rose-ink sm:px-3 sm:text-sm"><Icon name="heart" className="size-3.5 sm:size-4" />Cierre especial</span>
                      ) : plan ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-rose-ink sm:px-3 sm:text-sm"><Icon name="heart" className="size-3.5 sm:size-4" />Plan descargable</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-rose-ink sm:px-3 sm:text-sm"><Icon name="recipe" className="size-3.5 sm:size-4" />Receta para descargar</span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold sm:px-3 sm:text-sm ${st === "locked" ? "bg-surface-2 text-muted" : st === "preview" ? "bg-goldfoil text-wine" : "bg-rose text-white"}`}>
                        {st === "locked" ? "Se abre ese día" : st === "preview" ? "Vista previa" : "¡Ya disponible!"}
                      </span>
                    </span>
                    </span>
                  </button>
                </Reveal>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 text-center text-base text-muted">Cada receta se revela en su día. ¡Ven cada mañana a descubrirla!</p>
      </div>
    </section>
  );
}
