"use client";

import { useRef } from "react";
import { categories, extras } from "@/content/site";
import type { AssetIconName } from "@/content/assets.generated";
import { AssetIcon, has3D, Icon3D } from "./Assets";
import { TornEdge } from "./Edges";
import { Icon, type IconName } from "./Icons";
import { Eyebrow, Reveal, useReducedMotion } from "./ui";

const tabs = ["var(--c-rose)", "#ff7a3d", "var(--c-rose-ink)", "#e8a400", "#d6336c"];

/**
 * "¿Qué encontrarás dentro?": recipe-box index cards. As in the demo, the card under the pointer lifts and
 * tilts toward it while its neighbours lean away.
 */
function Deck() {
  const deck = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse") return;
    for (const c of Array.from(deck.current!.children) as HTMLElement[]) {
      const card = c.firstElementChild as HTMLElement;
      const r = c.getBoundingClientRect();
      const inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      if (inside) {
        const rx = -((e.clientY - r.top) / r.height - 0.5) * 16;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 16;
        card.style.transform = `translateY(-14px) translateZ(90px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.04)`;
        card.style.boxShadow = "0 50px 70px -24px rgb(233 30 99 / .45)";
        card.style.zIndex = "2";
      } else {
        const dx = r.left + r.width / 2 - e.clientX;
        const s = Math.sign(dx);
        const d = Math.min(1, 260 / Math.abs(dx || 1));
        card.style.transform = `translateX(${s * 16 * d}px) translateZ(-40px) rotateY(${-s * 12 * d}deg)`;
        card.style.boxShadow = "";
        card.style.zIndex = "";
      }
    }
  };
  const onLeave = () => {
    for (const c of Array.from(deck.current!.children) as HTMLElement[]) {
      const card = c.firstElementChild as HTMLElement;
      card.style.transform = "";
      card.style.boxShadow = "";
      card.style.zIndex = "";
    }
  };

  return (
    <ul ref={deck} onPointerMove={onMove} onPointerLeave={onLeave} className="mt-16 grid gap-x-5 gap-y-14 [perspective:1400px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {categories.map((c, i) => (
        <Reveal as="li" key={c.title} variant="flip" delay={0.08 * i} className="pt-6">
          <article className="index-card h-full px-4 pb-6 lift sm:px-6 sm:pb-8" style={{ "--tab": tabs[i], "--i": i } as React.CSSProperties}>
            <span className="index-tab">0{i + 1}</span>
            <span className="mt-2 grid size-20 place-items-center rounded-[24px] bg-surface text-rose lift">
              {has3D(c.icon) ? <Icon3D name={c.icon} className="size-16" /> : <AssetIcon name={c.icon as AssetIconName} className="size-12" />}
            </span>
            <h3 className="mt-5 font-display text-xl font-bold leading-tight sm:text-2xl">{c.title}</h3>
            {"list" in c ? (
              <ul className="mt-3 space-y-1.5">
                {c.list.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-base leading-snug sm:text-lg sm:leading-[33px]">
                    <Icon name="heartFill" className="size-4 shrink-0 text-rose" />
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-base leading-relaxed text-ink/85 sm:text-lg sm:leading-[35px]">{c.text}</p>
            )}
          </article>
        </Reveal>
      ))}
    </ul>
  );
}

export function Inside() {
  return (
    <section className="tex-paper relative bg-cream pb-0 pt-24 sm:pt-28 overflow-hidden">
      <TornEdge color="var(--c-cream)" seed={17} />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -right-4 top-[12%] text-5xl opacity-10 anim-drift" style={{ "--dur": "10s" } as React.CSSProperties}>🍪</span>
        <span className="absolute left-[4%] top-[35%] text-4xl opacity-12 anim-float" style={{ "--dur": "8s", "--delay": "1s" } as React.CSSProperties}>💕</span>
        <span className="absolute right-[7%] bottom-[25%] text-3xl opacity-15 anim-sway" style={{ "--dur": "7s", "--delay": "2s" } as React.CSSProperties}>🍓</span>
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="max-w-3xl">
          <Reveal><Eyebrow icon="rolling-pin">¿Qué encontrarás dentro?</Eyebrow></Reveal>
          <Reveal as="h2" delay={0.08} className="mt-4 font-display text-[clamp(2.4rem,5.2vw,4.4rem)] font-bold leading-[1.03]">
            Dulces recetas <span className="font-script font-normal text-water">en cada corazón</span>
          </Reveal>
          <Reveal as="p" delay={0.16} className="mt-5 text-lg text-muted">Pasa el cursor sobre las fichas: se acercan, se inclinan y empujan a las demás.</Reveal>
        </div>
        <Deck />
      </div>

      {/* "Mucho más que videos" band */}
      <div className="relative mt-24 overflow-hidden bg-rose py-16 text-white">
        <svg aria-hidden viewBox="0 0 1440 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-6 w-full text-cream">
          <path d="M0 0h1440v14c-60 0-60 18-120 18S1260 14 1200 14s-60 18-120 18-60-18-120-18-60 18-120 18-60-18-120-18-60 18-120 18-60-18-120-18-60 18-120 18-60-18-120-18-60 18-120 18-60-18-120-18-60 18-120 18S60 14 0 14Z" fill="currentColor" />
        </svg>
        <div className="tex-satin mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 text-center lg:flex-row lg:text-left">
          <div className="lg:w-[38%]">
            <Reveal as="h2" className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-bold leading-tight [text-shadow:0_3px_0_var(--c-rose-ink)] heading-shine">Mucho más que videos</Reveal>
            <Reveal as="p" delay={0.08} className="mt-2 text-lg text-white/95">Todo lo de cada día, listo para guardar y consultar cuando quieras.</Reveal>
          </div>
          <ul className="flex flex-1 flex-wrap justify-center gap-4 lg:justify-end">
            {extras.map((x, i) => (
              <Reveal as="li" key={x.text} variant="zoom" delay={0.1 * i}>
                <span className="inline-flex items-center gap-3 rounded-full bg-surface py-2 pl-2 pr-6 text-lg font-bold text-rose-ink shadow-[0_5px_0_var(--c-rose-ink),0_16px_30px_-12px_rgb(0_0_0/.35)]">
                  {has3D(x.icon) ? <Icon3D name={x.icon} className="size-11" /> : <span className="grid size-11 place-items-center rounded-full bg-goldfoil text-wine"><Icon name={x.icon as IconName} className="size-6" /></span>}
                  {x.text}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
