"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { nav } from "@/content/site";
import { Icon, Logo } from "./Icons";
import { useSound } from "./SoundProvider";

const subscribeTheme = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
};
const isDark = () => document.documentElement.classList.contains("dark");

function ThemeSwitch() {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);
  const flip = () => {
    const d = !dark;
    document.documentElement.classList.toggle("dark", d);
    try {
      localStorage.setItem("theme", d ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={flip}
      role="switch"
      aria-checked={dark}
      aria-label="Modo oscuro"
      className="relative flex h-11 w-[80px] shrink-0 items-center rounded-full bg-surface-2 p-1 shadow-[inset_0_2px_6px_rgb(var(--shadow-rgb)/0.18)]"
    >
      <span className="absolute left-2.5 opacity-70"><Icon name="sun" className="size-5" /></span>
      <span className="absolute right-2.5 opacity-70"><Icon name="moon" className="size-5" /></span>
      <span
        className={`relative z-10 grid size-9 place-items-center rounded-full bg-goldfoil shadow-[0_3px_0_#d98400,0_6px_12px_rgb(0_0_0/0.2)] transition-transform duration-500 ease-[var(--ease-spring)] ${dark ? "translate-x-[35px]" : ""}`}
      >
        <Icon name={dark ? "moon" : "sun"} className="size-5 text-wine" />
      </span>
    </button>
  );
}

function SoundButton() {
  const { on, toggle } = useSound();
  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={on ? "Silenciar música" : "Activar música"} className="btn3d sm icon-only cream relative">
      <Icon name={on ? "soundOn" : "soundOff"} className="size-6" />
      {on && <span aria-hidden className="absolute -inset-1 animate-ping rounded-full border-2 border-gold/60 [animation-duration:2.4s]" />}
    </button>
  );
}

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    nav.forEach((n) => {
      const el = document.querySelector(n.href);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const on = solid || open;
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-[max(10px,env(safe-area-inset-top))] sm:px-5">
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[30px] py-2 pl-2.5 pr-2 transition-all duration-500 sm:pl-4 ${on ? "bg-surface/90 lift backdrop-blur-xl" : ""}`}>
        <a href="#inicio" aria-label="Calendario de San Valentín 2027, inicio" className={`rounded-full transition ${on ? "" : "bg-surface/90 p-1.5 lift backdrop-blur-md"}`}>
          <Logo compact={!on} />
        </a>

        <nav aria-label="Principal" className="hidden xl:block">
          <ul className={`flex items-center gap-1 rounded-full p-1.5 transition ${on ? "" : "bg-surface/90 lift backdrop-blur-md"}`}>
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  aria-current={active === n.href ? "true" : undefined}
                  className={`relative block whitespace-nowrap rounded-full px-3 py-2.5 text-[0.95rem] font-bold transition ${active === n.href ? "bg-rose text-white shadow-[0_3px_0_#a10d44]" : "text-ink hover:bg-surface-2"}`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`flex items-center gap-2.5 rounded-full transition ${on ? "" : "xl:bg-surface/90 xl:p-1.5 xl:lift xl:backdrop-blur-md"}`}>
          <SoundButton />
          <div className={on ? "hidden sm:block" : "hidden xl:block"}><ThemeSwitch /></div>
          <a href="#precio" className={`btn3d sm gold ${on ? "hidden md:inline-flex" : "hidden xl:inline-flex"}`}>
            <span className="chip"><Icon name="gift" /></span>Quiero mi calendario
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="btn3d sm icon-only xl:hidden"
          >
            <span className={`absolute h-0.5 w-5 rounded bg-current transition duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute h-0.5 w-5 rounded bg-current transition duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`} />
          </button>
        </div>
      </div>

      <div
        id="menu-movil"
        hidden={!open}
        className="tex-linen fixed inset-x-3 bottom-3 top-[calc(max(10px,env(safe-area-inset-top))+74px)] overflow-auto rounded-[34px] bg-surface p-5 lift xl:hidden"
      >
        <nav aria-label="Menú">
          <ul className="space-y-2.5">
            {nav.map((n, i) => (
              <li key={n.href} style={{ animation: `pop-in .5s ${0.05 * i}s var(--ease-soft) backwards` }}>
                <a href={n.href} onClick={() => setOpen(false)} className="group flex items-center justify-between rounded-[26px] bg-surface-2 px-6 py-5 font-display text-3xl font-bold text-ink">
                  {n.label}
                  <span className="grid size-11 place-items-center rounded-full bg-rose text-white shadow-[0_3px_0_#a10d44] transition group-hover:translate-x-1">
                    <Icon name="right" className="size-5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-5 flex items-center justify-between gap-4 rounded-[26px] bg-surface-2 p-4">
          <span className="font-bold">Modo oscuro</span>
          <ThemeSwitch />
        </div>
        <a href="#precio" onClick={() => setOpen(false)} className="btn3d gold lg mt-5 w-full">
          <span className="chip"><Icon name="gift" /></span>Quiero mi calendario
        </a>
      </div>
    </header>
  );
}
