"use client";

import { site } from "@/content/site";
import { HeroSparkles } from "./HeroSparkles";
import { Icon } from "./Icons";
import { useShare } from "./Social";
import { useSound } from "./SoundProvider";

const sources = (crop: string, big: number, small: number, media?: string) =>
  (["avif", "webp"] as const).map((ext) => (
    <source
      key={crop + ext}
      media={media}
      type={`image/${ext}`}
      srcSet={`/img/cover-${crop}-${small}.${ext} ${small}w, /img/cover-${crop}.${ext} ${big}w`}
      sizes="100vw"
    />
  ));

export function Hero() {
  const { start } = useSound();
  const share = useShare();

  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <picture className="hero-bg">
        {sources("portrait", 1440, 1080, "(max-aspect-ratio: 4/5)")}
        {sources("square", 2048, 1200, "(max-aspect-ratio: 13/10)")}
        {sources("landscape", 2560, 1600)}
        <img src="/img/cover-landscape-1600.jpg" alt="" fetchPriority="high" decoding="async" />
      </picture>
      <div className="hero-shade dark:bg-[rgb(20_2_10/0.28)]" />
      <HeroSparkles className="hero-canvas" />

      <div className="hero-art">
        <p aria-hidden className="hero-kicker heading-shine" style={{ animation: "pop-in 1s .15s var(--ease-soft) backwards" }}>
          Calendario de<span className="hero-kyr"> · 2027</span>
        </p>
        <div className="hero-block">
          <h1 id="hero-title" className="flex flex-col items-center font-normal">
            {/* Screen readers get the full title; the visual parts change with screen size. */}
            <span className="sr-only">Calendario de San Valentín 2027</span>
            <span aria-hidden className="hero-title" style={{ animation: "pop-in 1.1s .3s var(--ease-soft) backwards" }}>San Valentín</span>
            <span aria-hidden className="hero-year" style={{ animation: "pop-in 1s .5s var(--ease-soft) backwards" }}>2027</span>
          </h1>
          <p className="hero-sub" style={{ animation: "pop-in 1s .7s var(--ease-soft) backwards" }}>{site.subtitle}</p>
          <a
            href="#calendario"
            onClick={start}
            aria-label="Abrir mi calendario"
            className="btn3d gold hero-cta anim-btn-bounce"
            style={{ animation: "pop-in 1s .9s var(--ease-soft) backwards, btn-bounce 3s ease-in-out 2s infinite" }}
          >
            <span className="chip"><Icon name="heartFill" className="text-rose" /></span>
            <span>
              Abrir<span className="hero-more"> mi calendario</span>
            </span>
          </a>
        </div>
      </div>

      <div className="hero-dock">
        <button type="button" onClick={() => share()} aria-label="Compartir" className="btn3d pearl sm max-[379px]:!px-1.5">
          <span className="chip"><Icon name="share" /></span>
          <span className="max-[379px]:sr-only">Compartir</span>
        </button>
        <a href="#calendario" className="btn3d pearl sm">
          <span className="chip"><Icon name="down" /></span>
          Ver los 14 días
        </a>
      </div>
    </section>
  );
}
