import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Environment validation", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports Supabase as missing when env vars are absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    const { validateEnv } = await import("../netlify/functions/lib/env-validation");
    const result = validateEnv();
    expect(result.ready).toBe(false);
    expect(result.warnings.some((w) => w.includes("Supabase"))).toBe(true);
  });

  it("reports ready when Supabase vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const mod = await import("../netlify/functions/lib/env-validation");
    const result = mod.validateEnv();
    expect(result.ready).toBe(true);
  });

  it("flags partial PayPal configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("PAYPAL_CLIENT_ID", "some-id");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "");

    const mod = await import("../netlify/functions/lib/env-validation");
    const result = mod.validateEnv();
    expect(result.warnings.some((w) => w.includes("PayPal") && w.includes("partial"))).toBe(true);
  });

  it("paypalConfigured returns false without credentials", async () => {
    vi.stubEnv("PAYPAL_CLIENT_ID", "");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "");

    const mod = await import("../netlify/functions/lib/env-validation");
    expect(mod.paypalConfigured()).toBe(false);
  });

  it("resendConfigured returns false without API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");

    const mod = await import("../netlify/functions/lib/env-validation");
    expect(mod.resendConfigured()).toBe(false);
  });

  it("rejects placeholder values as not present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "your-project-url");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "changeme");

    const mod = await import("../netlify/functions/lib/env-validation");
    const result = mod.validateEnv();
    expect(result.ready).toBe(false);
  });

  it("rejects values starting with 'xxx' as placeholders", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://real.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "real-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "real-anon");
    vi.stubEnv("PAYPAL_CLIENT_ID", "xxx-not-real");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "real-secret");

    const mod = await import("../netlify/functions/lib/env-validation");
    const result = mod.validateEnv();
    expect(result.warnings.some((w) => w.includes("PayPal") && w.includes("partial"))).toBe(true);
  });
});
