import { channel, nav, site } from "@/content/site";
import { FrostingEdge } from "./Edges";
import { Icon, Logo } from "./Icons";

const credits = [
  { what: "Videos y fotos de las recetas", who: channel.name, license: "YouTube", href: channel.url },
];

export function Footer() {
  return (
    <footer className="tex-linen relative bg-blush pb-10 pt-24 text-ink overflow-hidden">
      <FrostingEdge color="var(--c-blush)" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -left-4 top-[20%] text-5xl opacity-10 anim-float" style={{ "--dur": "9s" } as React.CSSProperties}>💗</span>
        <span className="absolute right-[5%] top-[30%] text-4xl opacity-10 anim-drift" style={{ "--dur": "11s", "--delay": "1s" } as React.CSSProperties}>✨</span>
      </div>
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-6 font-script text-[clamp(2.2rem,5vw,3.4rem)] leading-tight text-water">{site.subtitle}</p>
          <p className="mt-2 font-display text-2xl font-bold text-rose-ink">{site.hashtag}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <a href={channel.url} target="_blank" rel="noopener noreferrer" className="btn3d sm">
              <span className="chip"><Icon name="youtube" /></span>
              <span className="max-sm:hidden">{channel.name} en </span>YouTube
            </a>
          </div>
        </div>

        <nav aria-label="Pie de página" className="mt-12">
          <ul className="flex flex-wrap justify-center gap-x-2 gap-y-3">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="rounded-full px-3.5 py-2 text-base font-semibold transition hover:bg-surface hover:text-rose-ink sm:px-5 sm:py-2.5 sm:text-lg">{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-rose/20 pt-8 text-sm text-muted md:flex-row">
          <p>© 2026 {site.channelName ?? "Calendario de San Valentín"} · Hecho con cariño</p>
          <details className="group text-center md:text-right">
            <summary className="cursor-pointer list-none rounded-full px-4 py-2 font-semibold transition hover:bg-surface [&::-webkit-details-marker]:hidden">
              Créditos de imágenes y video <span className="inline-block transition group-open:rotate-180">⌄</span>
            </summary>
            <ul className="mt-2 space-y-1">
              {credits.map((c) => (
                <li key={c.href}>
                  <a href={c.href} target="_blank" rel="noopener noreferrer" className="underline decoration-rose/50 underline-offset-4 hover:text-rose-ink">{c.what}</a> · {c.who} · {c.license}
                </li>
              ))}
              <li>Ilustraciones de portada creadas para este proyecto</li>
            </ul>
          </details>
        </div>
      </div>
    </footer>
  );
}
