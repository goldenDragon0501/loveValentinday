"use client";

import { useState } from "react";
import { channel, type Recipe, recipes } from "@/content/site";
import { FrostingEdge } from "./Edges";
import { Icon } from "./Icons";
import { Eyebrow, Reveal } from "./ui";
import { YouTube } from "./YouTube";

const tabLabel = (title: string) => {
  const part = title.match(/parte\s*(\d+)/i);
  if (part) return `Parte ${part[1]}`;
  return /decorando/i.test(title) ? "Decoración" : "Receta";
};

/** One of Pedro's recipes: his YouTube video(s) on top, the recipe card below. */
function RecipeTile({ r, i }: { r: Recipe; i: number }) {
  const [v, setV] = useState(0);
  const count = r.groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <Reveal as="li" variant="flip" delay={0.08 * (i % 2)} className="h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[32px] bg-surface lift recipe-3d">
        <YouTube key={r.videos[v].id} id={r.videos[v].id} title={r.videos[v].title} className="aspect-video" />
        {r.videos.length > 1 && (
          <div role="tablist" aria-label={`Videos de ${r.title}`} className="flex gap-2 px-6 pt-4">
            {r.videos.map((x, k) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={k === v}
                onClick={() => setV(k)}
                className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${k === v ? "bg-rose text-white shadow-[0_3px_0_#a10d44]" : "bg-surface-2 text-rose-ink hover:bg-line"}`}
              >
                {tabLabel(x.title)}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3 className="font-display text-[1.4rem] font-bold leading-tight sm:text-[1.7rem]">{r.title}</h3>
          <p className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-rose-ink"><Icon name="recipe" className="size-4" />Receta para descargar</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-rose-ink"><Icon name="youtube" className="size-4" />{r.videos.length > 1 ? `${r.videos.length} videos` : "Video"} en YouTube</span>
          </p>
          <details className="group mt-5 rounded-[22px] border-2 border-dashed border-rose/30 bg-cream/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 font-bold text-rose-ink [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2"><Icon name="heartFill" className="size-5 text-rose" />Ingredientes ({count})</span>
              <Icon name="down" className="size-5 transition group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5">
              {r.groups.map((g) => (
                <div key={g.name ?? "main"} className="mt-2">
                  {g.name && <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.18em] text-muted">{g.name}</p>}
                  <ul className="mt-1.5 space-y-1">
                    {g.items.map((it) => (
                      <li key={it} className="flex items-start gap-2.5 text-base leading-snug">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-rose" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </div>
      </article>
    </Reveal>
  );
}

export function Recipes() {
  return (
    <section id="recetas" className="tex-linen relative bg-surface-2 py-24 sm:py-28 overflow-hidden">
      <FrostingEdge color="var(--c-surface-2)" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute right-[3%] top-[10%] text-5xl opacity-10 anim-drift" style={{ "--dur": "10s" } as React.CSSProperties}>🍫</span>
        <span className="absolute -left-4 top-[45%] text-4xl opacity-12 anim-float" style={{ "--dur": "8s", "--delay": "1.5s" } as React.CSSProperties}>🧁</span>
        <span className="absolute right-[8%] bottom-[8%] text-3xl opacity-15 anim-sway" style={{ "--dur": "7s", "--delay": "2s" } as React.CSSProperties}>💗</span>
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <Reveal><Eyebrow icon="whisk">Recetas de Pedro</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.08} className="mt-4 font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-bold leading-[1.03]">
              Un adelanto de lo que <span className="font-script font-normal text-water">vas a hornear</span>
            </Reveal>
            <Reveal as="p" delay={0.16} className="mt-5 text-lg text-muted">
              Algunas de las recetas del calendario, con el paso a paso de Pedro en su canal de YouTube. En tu calendario encontrarás cada receta lista para descargar.
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="btn3d">
              <span className="chip"><Icon name="youtube" /></span>Ver el canal
            </a>
          </Reveal>
        </div>
        <ul className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {recipes.map((r, i) => <RecipeTile key={r.slug} r={r} i={i} />)}
        </ul>
      </div>
    </section>
  );
}
