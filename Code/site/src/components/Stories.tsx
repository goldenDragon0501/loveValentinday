"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dayDate, highlights, preview, recipes, site } from "@/content/site";
import { type DayState as State, label, N, OPEN_DAY, short, useDayState } from "./days";
import { FrostingEdge } from "./Edges";
import { HeartRing } from "./HeartRing";
import { HeartStory } from "./HeartStory";
import { Icon, LogoMark } from "./Icons";
import { Icon3D } from "./Assets";
import { burst, downloadReminders, useToast } from "./Social";
import { useSound } from "./SoundProvider";
import { Eyebrow, Reveal, useReducedMotion } from "./ui";
import { YouTube } from "./YouTube";

/* ───────── Story viewer ───────── */
function StoryViewer({ day, state, onClose }: { day: number; state: State; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = state === "preview" ? 3 : 1;
  const recipe = recipes.find((r) => r.slug === preview.recipe) ?? recipes[0];
  const ingredients = recipe.groups.flatMap((g) => g.items);

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const next = useCallback(() => setSlide((s) => Math.min(slides - 1, s + 1)), [slides]);
  const prev = () => setSlide((s) => Math.max(0, s - 1));
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [next]);

  const react = (e: React.MouseEvent, glyph: string) => burst(e.clientX, e.clientY, [glyph, "♥", glyph]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      aria-label={`Historia del día ${day}`}
      className="m-auto h-[min(92dvh,860px)] w-[min(100vw-16px,calc(min(92dvh,860px)*0.56))] overflow-hidden rounded-[34px] bg-rose-ink p-0 text-white shadow-2xl backdrop:bg-transparent"
      style={{ animation: "pop-in .5s var(--ease-soft)" }}
    >
      <div className="tex-satin relative flex h-full flex-col">
        {/* progress */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {Array.from({ length: slides }, (_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                key={`${slide}-${i}`}
                className="story-timer block h-full origin-left bg-goldfoil"
                style={
                  i < slide
                    ? { transform: "scaleX(1)" }
                    : i > slide
                      ? { transform: "scaleX(0)" }
                      : (i === 0 && state === "preview") || slides === 1 || i === slides - 1
                          ? { transform: "scaleX(1)" }
                          : { animation: "progress 8s linear forwards", animationPlayState: paused ? "paused" : "running" }
                }
                onAnimationEnd={next}
              />
            </span>
          ))}
        </div>
        {/* header */}
        <div className="relative z-20 flex items-center gap-3 px-4 pb-3 pt-7">
          <span className="story size-11 shrink-0"><span className="grid size-full place-items-center bg-surface"><LogoMark className="size-8" /></span></span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate font-bold">Día {day} · {short(day)}</p>
            <p className="truncate text-sm text-white/75">{state === "preview" ? preview.note : label(day)}</p>
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar historia" className="btn3d sm icon-only cream">
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* slides */}
        <div
          className="relative z-10 min-h-0 flex-1 px-4"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
        >
          {state !== "preview" ? (
            <div className="grid h-full place-content-center gap-5 text-center">
              <Icon3D name="heart" className="mx-auto size-28 drop" />
              <p className="font-display text-3xl font-bold">Este corazón ya está abierto</p>
              <p className="text-white/90">Entra a tu cuenta para ver el video y descargar la receta.</p>
              <a href={site.buyerAreaUrl ?? "#precio"} onClick={() => ref.current?.close()} className="btn3d gold mx-auto">
                <span className="chip"><Icon name="heartFill" className="text-rose" /></span>
                {site.buyerAreaUrl ? "Entrar a mi calendario" : "Quiero mi calendario"}
              </a>
            </div>
          ) : slide === 0 ? (
            <div className="flex h-full flex-col gap-4 pb-2">
              <YouTube id={recipe.videos[0].id} title={recipe.videos[0].title} className="min-h-0 flex-1 rounded-[26px]" />
              <div>
                <p className="font-display text-2xl font-bold leading-tight">{recipe.title}</p>
                <p className="text-white/90">Paso a paso con Pedro, en su canal de YouTube</p>
              </div>
            </div>
          ) : slide === 1 ? (
            <div className="grid h-full place-items-center">
              <article className="w-full rounded-[28px] bg-cream p-6 text-ink lift" style={{ animation: "pop-in .5s var(--ease-soft)" }}>
                <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-rose-ink">
                  <Icon3D name="recipe" className="size-9" /> Receta para descargar
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight">{recipe.title}</h3>
                <ul className="mt-4 space-y-2 border-t-2 border-dashed border-line pt-4">
                  {ingredients.slice(0, 6).map((i) => (
                    <li key={i} className="flex items-start gap-3 text-base leading-snug">
                      <Icon name="heartFill" className="mt-1 size-4 shrink-0 text-rose" />
                      {i}
                    </li>
                  ))}
                </ul>
                {ingredients.length > 6 && <p className="mt-2 text-base font-semibold text-muted">y {ingredients.length - 6} ingredientes más</p>}
                <span className="btn3d dashed sm mt-5 w-full whitespace-normal text-center" aria-disabled="true">
                  <Icon name="download" className="size-5" /> Descarga disponible al comprar
                </span>
              </article>
            </div>
          ) : (
            <div className="grid h-full content-center justify-items-center gap-6 text-center" style={{ animation: "pop-in .5s var(--ease-soft)" }}>
              <p className="font-script text-6xl text-white">¿Te encantó?</p>
              <p className="max-w-xs text-lg text-white/95">Descubre las 14 recetas de Pedro para endulzar este San Valentín.</p>
              <a href="#precio" onClick={() => ref.current?.close()} className="btn3d gold">
                <span className="chip"><Icon name="gift" /></span>Quiero mi calendario
              </a>
            </div>
          )}
          {/* Tap zones (not on the video slide, where they would cover YouTube's controls). */}
          {slides > 1 && slide > 0 && (
            <>
              <button type="button" onClick={prev} aria-label="Anterior" className="absolute inset-y-0 left-0 z-0 w-1/4 cursor-w-resize" tabIndex={-1} />
              {slide < slides - 1 && <button type="button" onClick={next} aria-label="Siguiente" className="absolute inset-y-0 right-0 z-0 w-1/4 cursor-e-resize" tabIndex={-1} />}
            </>
          )}
        </div>

        {/* reactions */}
        <div className="relative z-20 flex items-center justify-between gap-2 px-4 pb-4 pt-3">
          <div className="flex gap-2">
            {["😍", "🍰", "❤️", "🔥"].map((g) => (
              <button key={g} type="button" onClick={(e) => react(e, g)} aria-label={`Reaccionar ${g}`} className="grid size-12 place-items-center rounded-full bg-white/20 text-2xl transition hover:scale-110 active:scale-90">
                {g}
              </button>
            ))}
          </div>
          {slides > 1 && (
            <div className="flex gap-2">
              <button type="button" onClick={prev} disabled={slide === 0} aria-label="Historia anterior" className="btn3d sm icon-only cream disabled:opacity-40">
                <Icon name="left" className="size-5" />
              </button>
              <button type="button" onClick={next} disabled={slide === slides - 1} aria-label="Historia siguiente" className="btn3d sm icon-only cream disabled:opacity-40">
                <Icon name="right" className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

/* ───────── Section ───────── */
export function Stories() {
  const { now, state } = useDayState();
  const reduced = useReducedMotion();
  const { chime } = useSound();
  const toast = useToast();
  const strip = useRef<HTMLDivElement>(null);
  const [opening, setOpening] = useState<number | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);

  const daysLeft = now === null ? null : Math.ceil((dayDate(1).getTime() - now) / 86_400_000);

  const open = useCallback(
    (n: number) => {
      const st = state(n);
      if (st === "locked") {
        setShake(n);
        window.setTimeout(() => setShake(null), 600);
        toast(`Este corazón se abre el ${label(n)}`);
        return;
      }
      setOpening(n);
      chime();
      window.setTimeout(() => setViewing(n), reduced ? 0 : 620);
    },
    [state, toast, chime, reduced],
  );

  // Other views (timeline, intro) open days through the same viewer.
  useEffect(() => {
    const on = (e: Event) => open((e as CustomEvent<number>).detail);
    window.addEventListener(OPEN_DAY, on);
    return () => window.removeEventListener(OPEN_DAY, on);
  }, [open]);
  const scroll = (dir: number) => strip.current?.scrollBy({ left: dir * strip.current.clientWidth * 0.7, behavior: "smooth" });

  return (
    <section id="calendario" className="tex-linen relative bg-surface-2 pb-24 pt-20 sm:pt-24">
      <FrostingEdge color="var(--c-surface-2)" />
      {/* Floating decorative accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -right-4 top-[12%] text-6xl opacity-10 anim-float" style={{ "--dur": "10s", "--delay": "0s" } as React.CSSProperties}>❤️</span>
        <span className="absolute left-[6%] top-[30%] text-3xl opacity-15 anim-drift" style={{ "--dur": "8s", "--delay": "1.5s" } as React.CSSProperties}>✨</span>
        <span className="absolute right-[10%] bottom-[15%] text-4xl opacity-10 anim-sway" style={{ "--dur": "9s", "--delay": "0.5s" } as React.CSSProperties}>🎀</span>
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <Reveal><Eyebrow icon="calendar" className="justify-center">Del 1 al 14 de febrero</Eyebrow></Reveal>
          <Reveal delay={0.08} as="h2" className="mx-auto mt-4 max-w-4xl font-display text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[1.02]">
            14 historias, <span className="font-script font-normal text-water">un corazón al día</span>
          </Reveal>
          <Reveal delay={0.16} as="p" className="mx-auto mt-5 max-w-2xl text-[clamp(1.1rem,1.6vw,1.3rem)] text-muted">
            Cada corazón guarda una receta de Pedro. Se abre a las {site.openTime} de su fecha y se queda abierto para ti.
          </Reveal>
        </div>

        {/* App-style story tray */}
        <Reveal variant="flip" delay={0.1} className="mt-12 rounded-[40px] bg-surface p-4 lift sm:p-7">
          <div className="flex flex-wrap items-center gap-4 border-b border-line pb-5">
            <span className="story live size-16 shrink-0"><span className="grid size-full place-items-center bg-surface"><LogoMark className="size-11" /></span></span>
            <div className="min-w-[12rem] flex-1">
              <p className="font-display text-2xl font-bold leading-tight">{site.name}</p>
              <p className="text-base text-muted">
                {daysLeft !== null && daysLeft > 0 ? (
                  <>Primer corazón en <b className="text-rose-ink">{daysLeft} días</b> · Día 1 ya tiene vista previa</>
                ) : (
                  "Un corazón nuevo cada día"
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={downloadReminders} className="btn3d cream sm">
                <span className="chip"><Icon name="bell" /></span>Recordármelo
              </button>
            </div>
          </div>

          {/* Desktop: the 3D ring of hearts from the demo. Phones and tablets: a swipeable strip. */}
          <div className="hidden lg:block">
            <HeartRing state={state} opening={opening} shake={shake} onOpen={open} />
          </div>
          <div className="mt-5 flex items-center gap-2 lg:hidden">
            <button type="button" onClick={() => scroll(-1)} aria-label="Ver días anteriores" className="btn3d sm icon-only cream mb-8 hidden shrink-0 sm:inline-flex anim-bob" style={{ "--dur": "3s" } as React.CSSProperties}>
              <Icon name="left" className="size-5" />
            </button>
            <div ref={strip} className="no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-3 pt-2 sm:gap-5">
              {Array.from({ length: N }, (_, i) => i + 1).map((n) => {
                const st = state(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => open(n)}
                    aria-label={`Día ${n}, ${label(n)}. ${st === "locked" ? "Bloqueado" : st === "preview" ? "Vista previa" : "Disponible"}`}
                    className={`group flex shrink-0 snap-start flex-col items-center gap-2 rounded-3xl p-1.5 ${st === "locked" ? "cursor-not-allowed" : ""}`}
                    style={{ animation: shake === n ? "shake .5s" : undefined }}
                  >
                    <span className={`relative drop transition-transform duration-300 ${st !== "locked" ? "group-hover:-translate-y-1 group-hover:scale-105" : ""}`} style={{ animation: `dot-pop 0.5s var(--ease-spring) ${n * 0.08}s backwards, ${st !== "locked" ? "heart-beat 2s ease-in-out 1.5s infinite" : "none"}` }}>
                      <HeartStory n={n} state={st} opening={opening === n} size={104} />
                      {st === "preview" && (
                        <span className="absolute -right-1 top-0 rounded-full bg-goldfoil px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-wine shadow-[0_2px_0_#d98400] anim-bob" style={{ "--dur": "2s" } as React.CSSProperties}>Ver</span>
                      )}
                    </span>
                    <span className={`text-sm font-extrabold uppercase tracking-[0.14em] ${st === "locked" ? "text-muted" : "text-rose-ink"}`}>{short(n)}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => scroll(1)} aria-label="Ver días siguientes" className="btn3d sm icon-only cream mb-8 hidden shrink-0 sm:inline-flex anim-bob" style={{ "--dur": "3s", "--delay": "0.5s" } as React.CSSProperties}>
              <Icon name="right" className="size-5" />
            </button>
          </div>
        </Reveal>

        {/* Highlights: how it works */}
        <div className="mt-14">
          <Reveal as="h3" className="text-center font-display text-3xl font-bold heading-shine sm:text-4xl">Así funciona</Reveal>
          <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-3">
            {highlights.map((h, i) => (
              <Reveal as="li" key={h.title} variant="zoom" delay={0.08 * i} className="flex flex-col items-center text-center">
                <span className="story size-28 sm:size-32" style={{ animation: `step-float 5s ease-in-out ${i * 0.5}s infinite` }}>
                  <span className="grid size-full place-items-center bg-surface text-rose">
                    <span style={{ animation: `step-pop 0.8s var(--ease-spring) ${0.3 + i * 0.15}s backwards`, display: "grid", placeItems: "center" }}>
                      <Icon3D name={h.icon} className="size-[72px] sm:size-[80px]" />
                    </span>
                  </span>
                </span>
                <span className="-mt-4 rounded-full bg-goldfoil px-3 py-0.5 font-display text-lg font-extrabold text-wine shadow-[0_3px_0_#d98400] anim-bob" style={{ "--dur": "3s", "--delay": `${i * 0.3}s` } as React.CSSProperties}>{i + 1}</span>
                <p className="mt-3 font-display text-xl font-bold sm:text-2xl">{h.title}</p>
                <p className="mt-1 max-w-[15rem] text-sm text-muted sm:text-base">{h.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      {viewing !== null && (
        <StoryViewer
          day={viewing}
          state={state(viewing)}
          onClose={() => {
            setViewing(null);
            setOpening(null);
          }}
        />
      )}
    </section>
  );
}
