"use client";

import { useRef } from "react";
import { intro, site } from "@/content/site";
import { AssetImage, Icon3D } from "./Assets";
import { FrostingEdge } from "./Edges";
import { Icon, LogoMark } from "./Icons";
import { Eyebrow, Reveal } from "./ui";

/** The demo's second screen: headline, offer button and the 3D calendar book with items orbiting it. */
export function Intro() {
  const scene = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDivElement>(null);

  // The book turns toward the pointer anywhere over the scene.
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = scene.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    book.current!.style.setProperty("--ry", `${(x * 34).toFixed(1)}deg`);
    book.current!.style.setProperty("--rx", `${(6 - y * 22).toFixed(1)}deg`);
  };
  const onLeave = () => {
    book.current!.style.removeProperty("--ry");
    book.current!.style.removeProperty("--rx");
  };

  const orbiters = [
    { a: "0deg", y: "18%", el: <Icon3D name="strawberry" className="size-20 drop" /> },
    { a: "72deg", y: "70%", el: <AssetImage name="cookie-heart" alt="" sizes="96px" className="w-24 drop" /> },
    { a: "144deg", y: "34%", el: <Icon3D name="sparkle" className="size-14 drop" /> },
    { a: "216deg", y: "82%", el: <Icon3D name="heart-cake" className="size-20 drop" /> },
    { a: "288deg", y: "8%", el: <LogoMark className="size-14 drop" /> },
  ];

  return (
    <section className="tex-paper relative overflow-hidden bg-bg pb-24 pt-20 sm:pt-24">
      <FrostingEdge color="var(--c-bg)" />
      {/* Floating decorative accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-8 top-[15%] text-5xl opacity-20 anim-drift" style={{ "--dur": "9s", "--delay": "0s" } as React.CSSProperties}>💗</span>
        <span className="absolute right-[5%] top-[8%] text-4xl opacity-15 anim-float" style={{ "--dur": "7s", "--delay": "1s" } as React.CSSProperties}>✨</span>
        <span className="absolute left-[12%] bottom-[10%] text-3xl opacity-15 anim-sway" style={{ "--dur": "8s", "--delay": "2s" } as React.CSSProperties}>🍰</span>
        <span className="absolute right-[8%] bottom-[20%] text-5xl opacity-10 anim-drift" style={{ "--dur": "11s", "--delay": "0.5s" } as React.CSSProperties}>💕</span>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <Reveal><Eyebrow icon="gift">{intro.eyebrow}</Eyebrow></Reveal>
          <Reveal as="h2" delay={0.08} className="mt-4 font-display text-[clamp(2.6rem,5.6vw,4.8rem)] font-bold leading-[1.03]">
            {intro.title} <span className="font-script font-normal text-water">{intro.accent}</span>
          </Reveal>
          <Reveal as="p" delay={0.16} className="mt-6 max-w-xl text-[clamp(1.1rem,1.6vw,1.3rem)] text-muted">{intro.lead}</Reveal>
          <Reveal delay={0.24} className="mt-9 flex flex-wrap gap-4">
            <a href="#precio" className="btn3d gold lg anim-btn-bounce"><span className="chip"><Icon name="gift" /></span>Quiero mi calendario</a>
            <a href="#calendario" className="btn3d cream lg anim-btn-bounce" style={{ animationDelay: "0.5s" }}><span className="chip"><Icon name="heartFill" /></span>Ver los corazones</a>
          </Reveal>
          <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
            {[["14", "corazones"], ["8:00", "cada mañana"], ["1", "receta especial"]].map(([n, t], i) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 lift anim-bob sm:gap-2 sm:px-4 sm:py-2" style={{ "--dur": "4s", "--delay": `${i * 0.4}s` } as React.CSSProperties}>
                <b className="font-display text-xl text-rose sm:text-2xl" style={{ fontVariantNumeric: "tabular-nums" }}>{n}</b>
                <span className="text-sm font-semibold text-muted sm:text-base">{t}</span>
              </span>
            ))}
          </Reveal>
        </div>

        <Reveal variant="right" delay={0.1}>
          <div ref={scene} onPointerMove={onMove} onPointerLeave={onLeave} className="book-scene h-[clamp(460px,52vw,640px)]">
            <div aria-hidden className="absolute bottom-[8%] h-10 w-[60%] rounded-[50%] bg-rose/25 blur-2xl" />
            <div ref={book} className="book" role="img" aria-label={`Libro del calendario «${site.name}», San Valentín 2027`}>
              <div className="book-back" />
              <div className="book-spine" />
              <div className="book-pages" />
              <div className="book-top" />
              <div className="book-cover tex-satin flex flex-col items-center justify-center p-6 text-center">
                <span aria-hidden className="pointer-events-none absolute inset-3 rounded-[4px_14px_14px_4px] border-2 border-dashed border-gold-hi/70" />
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.28em] text-gold-hi">Calendario de San Valentín</p>
                <LogoMark className="mt-4 size-20 drop" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.26em] text-white/90">14 días de</p>
                <p className="pt-1 font-script text-[2.7rem] leading-[1.1] text-goldfoil">Dulce Amor</p>
                <span className="mt-2 rounded-full bg-goldfoil px-3 font-display text-lg font-extrabold tracking-[0.2em] text-wine shadow-[0_3px_0_#d98400]">2027</span>
              </div>
              <div className="book-ribbon" />
            </div>
            <div aria-hidden className="orbit">
              {orbiters.map((o, i) => (
                <div key={i} className="orbit-item" style={{ "--a": o.a, "--y": o.y, "--d": `${(-parseFloat(o.a) / 360) * 16}s` } as React.CSSProperties}>
                  <div className="orbit-face">{o.el}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
