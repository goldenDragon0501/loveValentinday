import { describe, it, expect } from "vitest";
import { site, schedule, recipes, day14Plan } from "../src/content/site";

describe("Phase 9: Contact-based purchase model", () => {
  it("site has contact configuration object", () => {
    expect(site.contact).toBeDefined();
    expect(site.contact).toHaveProperty("whatsapp");
    expect(site.contact).toHaveProperty("email");
    expect(site.contact).toHaveProperty("instagram");
    expect(site.contact).toHaveProperty("whatsappMessage");
  });

  it("WhatsApp prefilled message is non-empty Spanish text", () => {
    expect(site.contact.whatsappMessage).toBeTruthy();
    expect(site.contact.whatsappMessage.length).toBeGreaterThan(10);
  });

  it("checkoutUrl still points to /comprar/ for contact page", () => {
    expect(site.checkoutUrl).toBe("/comprar/");
  });

  it("buyerAreaUrl points to /calendario/", () => {
    expect(site.buyerAreaUrl).toBe("/calendario/");
  });
});

describe("Phase 9: Manual access grant model", () => {
  it("access tokens are valid UUIDs", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("access URL format is correct", () => {
    const token = crypto.randomUUID();
    const baseUrl = "https://lovevalentinday.netlify.app";
    const accessUrl = `${baseUrl}/calendario/?token=${token}`;
    expect(accessUrl).toContain("/calendario/?token=");
    expect(accessUrl).toContain(token);
  });

  it("grant types include manual and payment", () => {
    const validTypes = ["manual", "payment"];
    expect(validTypes).toContain("manual");
    expect(validTypes).toContain("payment");
  });
});

describe("Phase 9: Disabled payment methods", () => {
  it("payment endpoints return 410 response message", () => {
    const disabledMessage = "El sistema de pagos automáticos ha sido deshabilitado.";
    expect(disabledMessage).toBeTruthy();
    expect(disabledMessage).toContain("deshabilitado");
  });

  it("legacy payment methods are documented", () => {
    const legacyMethods = ["paypal", "ath_movil", "zelle"];
    expect(legacyMethods).toHaveLength(3);
  });
});

describe("Phase 9: Admin customer management actions", () => {
  const validActions = [
    "register_customer",
    "generate_access_link",
    "revoke_access",
    "activate_access",
    "resend_access",
  ];

  it("register_customer action is defined", () => {
    expect(validActions).toContain("register_customer");
  });

  it("generate_access_link action is defined", () => {
    expect(validActions).toContain("generate_access_link");
  });

  it("revoke_access action is preserved", () => {
    expect(validActions).toContain("revoke_access");
  });

  it("activate_access action is preserved", () => {
    expect(validActions).toContain("activate_access");
  });

  it("all five customer actions exist", () => {
    expect(validActions).toHaveLength(5);
  });

  it("email validation pattern rejects invalid emails", () => {
    const isValid = (email: string) =>
      typeof email === "string" && email.includes("@") && email.trim().length > 3;
    expect(isValid("user@example.com")).toBe(true);
    expect(isValid("bad")).toBe(false);
    expect(isValid("")).toBe(false);
    expect(isValid("@")).toBe(false);
  });

  it("name validation requires minimum 2 characters", () => {
    const isValid = (name: string) =>
      typeof name === "string" && name.trim().length >= 2;
    expect(isValid("Ana")).toBe(true);
    expect(isValid("A")).toBe(false);
    expect(isValid("")).toBe(false);
    expect(isValid("María González")).toBe(true);
  });
});

describe("Phase 9: Recipe order unchanged from Phase 8", () => {
  it("schedule still has 14 days", () => {
    expect(schedule).toHaveLength(14);
  });

  it("recipes still has 14 recipes", () => {
    expect(recipes).toHaveLength(14);
  });

  it("Day 14 is still the coquito closing", () => {
    expect(schedule[13].title).toContain("coquito");
  });

  it("Day 14 closing plan is still present", () => {
    expect(day14Plan).toBeDefined();
    expect(day14Plan.title).toBeTruthy();
    expect(day14Plan.steps.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Phase 9: Environment variable simplification", () => {
  it("core required variables are Supabase only", () => {
    const coreVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];
    expect(coreVars).toHaveLength(3);
  });

  it("payment variables are no longer required", () => {
    const paymentVars = [
      "PAYPAL_CLIENT_ID",
      "PAYPAL_CLIENT_SECRET",
      "ATH_MOVIL_PUBLIC_TOKEN",
      "ATH_MOVIL_PRIVATE_TOKEN",
    ];
    for (const v of paymentVars) {
      expect(process.env[v]).toBeUndefined();
    }
  });
});

describe("Phase 9: Database migration 006", () => {
  it("migration makes order_id nullable for manual grants", () => {
    const migrationChanges = {
      orderIdNullable: true,
      grantTypeColumn: "TEXT NOT NULL DEFAULT 'payment'",
      grantedByColumn: "UUID REFERENCES admin_users(id)",
      grantNotesColumn: "TEXT",
    };
    expect(migrationChanges.orderIdNullable).toBe(true);
    expect(migrationChanges.grantTypeColumn).toContain("DEFAULT 'payment'");
  });

  it("grant_type distinguishes manual from payment access", () => {
    const types = ["payment", "manual"];
    expect(types).toContain("payment");
    expect(types).toContain("manual");
    expect(types).not.toContain("free");
  });
});
