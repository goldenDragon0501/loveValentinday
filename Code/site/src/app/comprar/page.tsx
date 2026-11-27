"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/content/site";

function whatsappUrl(): string | null {
  if (!site.contact.whatsapp) return null;
  const phone = site.contact.whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(site.contact.whatsappMessage);
  return `https://wa.me/${phone}?text=${text}`;
}

export default function ComprarPage() {
  const wa = whatsappUrl();
  const hasContact = wa || site.contact.email || site.contact.instagram;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="mx-auto max-w-lg space-y-8">
          <div className="text-center">
            <h1 className="font-playfair text-3xl font-bold text-ink mb-2">
              Obtén tu calendario
            </h1>
            <p className="text-ink/60">
              14 días de dulce amor — recetas, videos y sorpresas para San Valentín
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-5">
            <div className="text-center">
              <span className="text-5xl">💗</span>
              <h2 className="mt-3 font-playfair text-xl font-bold text-ink">
                ¿Cómo adquirir el calendario?
              </h2>
              <p className="mt-2 text-ink/60">
                Escríbenos directamente para coordinar tu compra. Una vez confirmado
                el pago, recibirás tu enlace personal de acceso al calendario.
              </p>
            </div>

            {hasContact ? (
              <div className="space-y-3">
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full rounded-xl bg-[#25D366] py-4 text-lg font-bold text-white shadow-lg hover:bg-[#20bd5a] transition-colors"
                  >
                    <svg className="size-6 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Escríbenos por WhatsApp
                  </a>
                )}

                {site.contact.email && (
                  <a
                    href={`mailto:${site.contact.email}?subject=${encodeURIComponent("Interesado/a en 14 días de dulce amor")}`}
                    className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-rose py-4 text-lg font-bold text-rose hover:bg-rose/5 transition-colors"
                  >
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Envíanos un correo
                  </a>
                )}

                {site.contact.instagram && (
                  <a
                    href={`https://instagram.com/${site.contact.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-ink/20 py-4 text-lg font-bold text-ink/70 hover:bg-ink/5 transition-colors"
                  >
                    <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    Síguenos en Instagram
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-gold/10 p-4 text-center">
                <p className="text-sm font-semibold text-gold">
                  Los canales de contacto se configurarán próximamente.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-4">
            <h3 className="font-playfair text-lg font-bold text-ink">¿Cómo funciona?</h3>
            <ol className="space-y-3 text-ink/70">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose/10 text-sm font-bold text-rose">1</span>
                <span>Escríbenos para coordinar tu compra</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose/10 text-sm font-bold text-rose">2</span>
                <span>Realiza el pago directamente</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose/10 text-sm font-bold text-rose">3</span>
                <span>Recibe tu enlace personal de acceso al calendario</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose/10 text-sm font-bold text-rose">4</span>
                <span>Disfruta una receta nueva cada día del 1 al 14 de febrero</span>
              </li>
            </ol>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-ink/40 hover:text-ink/60 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
