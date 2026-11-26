"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { checkout, createPayPalOrder, capturePayPalOrder } from "@/lib/api";
import type { CheckoutResult } from "@/lib/api";

type PaymentMethod = "paypal" | "ath_movil" | "zelle";

const METHODS: { id: PaymentMethod; label: string; desc: string }[] = [
  { id: "ath_movil", label: "ATH Móvil", desc: "Paga desde tu app ATH Móvil" },
  { id: "paypal", label: "PayPal", desc: "Paga con tu cuenta PayPal" },
  { id: "zelle", label: "Zelle", desc: "Transferencia directa por Zelle" },
];

type Step = "form" | "processing" | "zelle-instructions" | "success" | "error";

export default function ComprarPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("ath_movil");
  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [accessUrl, setAccessUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("processing");
    setErrorMsg("");

    try {
      const res = await checkout(email, name, method);
      setResult(res);

      if (method === "zelle") {
        setStep("zelle-instructions");
        return;
      }

      if (method === "paypal") {
        const pp = await createPayPalOrder(res.order.id);
        // In production, this would redirect to PayPal's approval URL.
        // For now, we capture directly (sandbox flow).
        const capture = await capturePayPalOrder(pp.paypalOrderId);
        if (capture.accessUrl) setAccessUrl(capture.accessUrl);
        setStep("success");
        return;
      }

      // ATH Móvil — handled by ATH Móvil Business SDK on client
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error inesperado");
      setStep("error");
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="mx-auto max-w-lg">
          <h1 className="font-playfair text-3xl font-bold text-center mb-2">
            Compra tu calendario
          </h1>
          <p className="text-center text-ink/60 mb-8">
            14 días de dulce amor — recetas, videos y sorpresas para San Valentín
          </p>

          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-ink/80 mb-1">
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink focus:border-rose focus:ring-2 focus:ring-rose/30 outline-none"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink/80 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink focus:border-rose focus:ring-2 focus:ring-rose/30 outline-none"
                  placeholder="tu@correo.com"
                />
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-ink/80 mb-3">
                  Método de pago
                </legend>
                <div className="space-y-3">
                  {METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                        method === m.id
                          ? "border-rose bg-rose/5 ring-2 ring-rose/30"
                          : "border-ink/10 hover:border-ink/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m.id}
                        checked={method === m.id}
                        onChange={() => setMethod(m.id)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          method === m.id ? "border-rose" : "border-ink/20"
                        }`}
                      >
                        {method === m.id && (
                          <span className="h-2.5 w-2.5 rounded-full bg-rose" />
                        )}
                      </span>
                      <div>
                        <span className="font-semibold text-ink">{m.label}</span>
                        <span className="block text-sm text-ink/50">{m.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                className="w-full rounded-xl bg-rose py-4 text-lg font-bold text-white shadow-lg hover:bg-rose/90 transition-colors anim-btn-bounce"
              >
                Continuar con el pago
              </button>
            </form>
          )}

          {step === "processing" && (
            <div className="text-center py-16">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-rose border-t-transparent" />
              <p className="mt-4 text-ink/60">Procesando tu orden...</p>
            </div>
          )}

          {step === "zelle-instructions" && result?.zelle && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6 space-y-4">
              <h2 className="font-playfair text-xl font-bold text-ink">
                Instrucciones de pago por Zelle
              </h2>
              <p className="text-ink/70">{result.zelle.instructions}</p>
              <div className="rounded-xl bg-cream/50 p-4 space-y-2">
                {result.zelle.recipientName && (
                  <p><span className="font-semibold">Nombre:</span> {result.zelle.recipientName}</p>
                )}
                {result.zelle.recipientEmail && (
                  <p><span className="font-semibold">Email:</span> {result.zelle.recipientEmail}</p>
                )}
                {result.zelle.recipientPhone && (
                  <p><span className="font-semibold">Teléfono:</span> {result.zelle.recipientPhone}</p>
                )}
              </div>
              <p className="text-sm text-ink/50">
                Tu referencia: <strong>{result.order.reference}</strong>
              </p>
              <p className="text-sm text-ink/50">
                Una vez verificado el pago, recibirás un correo con tu enlace de acceso al calendario.
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="font-playfair text-2xl font-bold text-ink">
                ¡Compra exitosa!
              </h2>
              <p className="text-ink/60">
                Revisa tu correo electrónico para acceder a tu calendario.
              </p>
              {accessUrl && (
                <a
                  href={accessUrl}
                  className="inline-block rounded-xl bg-rose px-6 py-3 font-bold text-white hover:bg-rose/90 transition-colors"
                >
                  Abrir mi calendario
                </a>
              )}
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">😔</div>
              <h2 className="font-playfair text-2xl font-bold text-ink">
                Hubo un problema
              </h2>
              <p className="text-ink/60">{errorMsg}</p>
              <button
                onClick={() => setStep("form")}
                className="inline-block rounded-xl bg-rose px-6 py-3 font-bold text-white hover:bg-rose/90 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
