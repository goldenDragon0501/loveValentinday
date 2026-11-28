"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gift, site } from "@/content/site";
import { Icon3D } from "./Assets";
import { Icon } from "./Icons";
import { useToast } from "./Social";

// Love-card maker. The card is drawn on a canvas at phone-story size (1080×1920) on the approved
// portrait cover, with the message set inside its glowing heart, ready to download or share.
const W = 1080;
const H = 1920;

const themes = [
  { id: "oro", label: "Oro", ink: "#fff3cf", accent: "#ffc21a" },
  { id: "rosa", label: "Rosa", ink: "#ffe3ee", accent: "#ff7aa8" },
  { id: "perla", label: "Perla", ink: "#ffffff", accent: "#ffe27a" },
];

const fontVar = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export function GiftCard() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const bg = useRef<HTMLImageElement | null>(null);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [msg, setMsg] = useState(gift.messages[0]);
  const [theme, setTheme] = useState(themes[0]);
  const [ready, setReady] = useState(false);
  const toast = useToast();

  const draw = useCallback(() => {
    const cv = canvas.current;
    const img = bg.current;
    if (!cv || !img) return;
    const ctx = cv.getContext("2d")!;
    const script = fontVar("--font-vibes", "cursive");
    const serif = fontVar("--font-playfair", "Georgia, serif");
    const sans = fontVar("--font-jakarta", "sans-serif");
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(60,0,20,.6)";
    ctx.shadowBlur = 18;

    // "Para …" above the heart's cleft
    ctx.fillStyle = theme.ink;
    ctx.font = `700 40px ${sans}`;
    ctx.letterSpacing = "10px";
    ctx.fillText(`PARA ${(to || "ti").toUpperCase()}`.slice(0, 32), W / 2, H * 0.165);
    ctx.letterSpacing = "0px";

    // Message in script, inside the heart
    ctx.font = `110px ${script}`;
    const lines = wrap(ctx, msg, W * 0.62).slice(0, 3);
    const lh = 118;
    const top = H * 0.315 - ((lines.length - 1) * lh) / 2;
    const g = ctx.createLinearGradient(0, top - 70, 0, top + lines.length * lh);
    g.addColorStop(0, "#fff8d6");
    g.addColorStop(0.5, theme.accent);
    g.addColorStop(1, "#ffe58a");
    ctx.fillStyle = g;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));

    // Ribbon with the year
    // Sized from the text so the whole title sits on the ribbon.
    ctx.shadowBlur = 0;
    ctx.font = `800 40px ${serif}`;
    ctx.letterSpacing = "8px";
    const title = "SAN VALENTÍN 2027";
    const rw = ctx.measureText(title).width + 110, rh = 68, ry = H * 0.415;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.moveTo(W / 2 - rw / 2, ry - rh / 2);
    ctx.lineTo(W / 2 + rw / 2, ry - rh / 2);
    ctx.lineTo(W / 2 + rw / 2 - 22, ry);
    ctx.lineTo(W / 2 + rw / 2, ry + rh / 2);
    ctx.lineTo(W / 2 - rw / 2, ry + rh / 2);
    ctx.lineTo(W / 2 - rw / 2 + 22, ry);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5c0a2b";
    ctx.fillText(title, W / 2 + 4, ry + 2);
    ctx.letterSpacing = "0px";

    // Signature pill near the bottom
    const sig = `Con amor, ${from || "yo"}`.slice(0, 40);
    ctx.font = `italic 600 48px ${serif}`;
    const sw = ctx.measureText(sig).width + 90;
    const sy = H * 0.905;
    ctx.fillStyle = "rgba(60,4,24,.55)";
    ctx.beginPath();
    ctx.roundRect(W / 2 - sw / 2, sy - 50, sw, 100, 50);
    ctx.fill();
    ctx.fillStyle = "#fff6ee";
    ctx.fillText(sig, W / 2, sy + 2);
    ctx.font = `600 30px ${sans}`;
    ctx.fillStyle = "rgba(255,240,230,.9)";
    ctx.fillText(site.hashtag, W / 2, H * 0.965);
  }, [to, from, msg, theme]);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.src = "/img/cover-portrait-1080.jpg";
    Promise.all([img.decode(), document.fonts.ready]).then(() => {
      if (!alive) return;
      bg.current = img;
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  const blob = () => new Promise<Blob | null>((r) => canvas.current!.toBlob(r, "image/png"));
  const download = async () => {
    const b = await blob();
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `tarjeta-san-valentin${to ? "-" + to.toLowerCase().replace(/\s+/g, "-") : ""}.png`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Tarjeta descargada");
  };
  const line = "w-full border-0 border-b-2 border-dashed border-rose/40 bg-transparent px-1 pb-1 pt-2 font-display text-2xl font-bold italic text-ink outline-none transition placeholder:font-normal placeholder:text-muted/50 focus:border-solid focus:border-rose";

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,400px)]">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Postcard */}
        <div className="postcard relative grid gap-8 p-6 drop sm:grid-cols-[1.25fr_1fr] sm:p-9" style={{ rotate: "-1deg" }}>
          <span aria-hidden className="absolute inset-3 rounded-[12px] border-2 border-dashed border-gold/60" />
          <div className="relative">
            <p className="font-script text-4xl leading-none text-rose">Querido amor,</p>
            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-rose-ink">Elige un mensaje</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {gift.messages.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={msg === m}
                  onClick={() => setMsg(m)}
                  className={`rounded-full px-3.5 py-2 text-[0.95rem] font-bold transition ${msg === m ? "bg-rose text-white shadow-[0_3px_0_#a10d44]" : "bg-surface text-ink shadow-sm hover:bg-line"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <label className="mt-5 block">
              <span className="sr-only">Escribe tu propio mensaje</span>
              <textarea className={`${line} resize-none`} rows={2} value={msg} maxLength={60} onChange={(e) => setMsg(e.target.value.replace(/\s*\n\s*/g, " "))} placeholder="O escribe el tuyo…" />
            </label>
          </div>
          <div className="relative sm:border-l-2 sm:border-dashed sm:border-rose/30 sm:pl-8">
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden className="postmark grid size-24 rotate-[-12deg] place-items-center text-center text-[0.6rem] font-extrabold uppercase leading-tight tracking-widest text-wine-2/70">
                Correo<br />de amor<br />feb · 2027
              </span>
              <span aria-hidden className="stamp rotate-3">
                <span className="grid h-24 w-20 place-items-center rounded-[2px] bg-goldfoil text-rose">
                  <Icon3D name="heart" className="size-14 drop" />
                </span>
              </span>
            </div>
            <label className="mt-6 block">
              <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-rose-ink">Para</span>
              <input className={line} value={to} maxLength={24} onChange={(e) => setTo(e.target.value)} placeholder="Su nombre" />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-rose-ink">De</span>
              <input className={line} value={from} maxLength={24} onChange={(e) => setFrom(e.target.value)} placeholder="Tu nombre" />
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <fieldset className="flex gap-2">
            <legend className="sr-only">Estilo de la tarjeta</legend>
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={theme.id === t.id}
                onClick={() => setTheme(t)}
                aria-label={`Estilo ${t.label}`}
                className={`grid size-12 place-items-center rounded-full transition ${theme.id === t.id ? "bg-rose ring-4 ring-rose/25" : "bg-surface lift"}`}
              >
                <span className="size-8 rounded-full border-2 border-white shadow" style={{ background: t.accent }} />
              </button>
            ))}
          </fieldset>
          <button type="button" onClick={download} className="btn3d gold">
            <span className="chip"><Icon name="download" /></span>Descargar
          </button>
        </div>
      </form>

      <div className="relative mx-auto w-full max-w-[380px]">
        <div className="relative rounded-[44px] bg-surface p-3 ring-1 ring-line lift">
          <span aria-hidden className="absolute left-1/2 top-5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#1a0610]/85" />
          <canvas ref={canvas} width={W} height={H} className="block aspect-[9/16] w-full rounded-[34px] bg-rose" role="img" aria-label={`Vista previa de la tarjeta: ${msg}, para ${to || "ti"}, de ${from || "mí"}`} />
        </div>
        <span aria-hidden className="absolute -right-1 -top-4 grid size-16 sm:-right-4 rotate-12 place-items-center rounded-full bg-goldfoil text-wine shadow-[0_4px_0_#d98400]">
          <Icon name="heartFill" className="size-8 text-rose" />
        </span>
      </div>
    </div>
  );
}
