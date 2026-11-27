type EnvGroup = {
  name: string;
  required: boolean;
  vars: { key: string; present: boolean }[];
};

const PLACEHOLDER_PATTERNS = ["placeholder", "your-", "xxx", "changeme", "TODO"];

function isPlaceholder(val: string): boolean {
  const lower = val.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.startsWith(p));
}

function isPresent(key: string): boolean {
  const val = process.env[key];
  return typeof val === "string" && val.length > 0 && !isPlaceholder(val);
}

export function validateEnv(): {
  groups: EnvGroup[];
  ready: boolean;
  warnings: string[];
} {
  const groups: EnvGroup[] = [
    {
      name: "Supabase",
      required: true,
      vars: [
        { key: "NEXT_PUBLIC_SUPABASE_URL", present: isPresent("NEXT_PUBLIC_SUPABASE_URL") },
        { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", present: isPresent("NEXT_PUBLIC_SUPABASE_ANON_KEY") },
        { key: "SUPABASE_SERVICE_ROLE_KEY", present: isPresent("SUPABASE_SERVICE_ROLE_KEY") },
      ],
    },
    {
      name: "Admin",
      required: false,
      vars: [
        { key: "ADMIN_SECRET", present: isPresent("ADMIN_SECRET") },
      ],
    },
    {
      name: "Email (Resend)",
      required: false,
      vars: [
        { key: "RESEND_API_KEY", present: isPresent("RESEND_API_KEY") },
        { key: "RESEND_FROM_EMAIL", present: isPresent("RESEND_FROM_EMAIL") },
        { key: "RESEND_FROM_NAME", present: isPresent("RESEND_FROM_NAME") },
      ],
    },
    {
      name: "General",
      required: false,
      vars: [
        { key: "PUBLIC_URL", present: isPresent("PUBLIC_URL") },
        { key: "CRON_SECRET", present: isPresent("CRON_SECRET") },
      ],
    },
    // Phase 9: payment groups below are legacy — automated payments disabled
    {
      name: "PayPal (deshabilitado)",
      required: false,
      vars: [
        { key: "PAYPAL_CLIENT_ID", present: isPresent("PAYPAL_CLIENT_ID") },
        { key: "PAYPAL_CLIENT_SECRET", present: isPresent("PAYPAL_CLIENT_SECRET") },
        { key: "PAYPAL_ENVIRONMENT", present: isPresent("PAYPAL_ENVIRONMENT") },
        { key: "PAYPAL_WEBHOOK_ID", present: isPresent("PAYPAL_WEBHOOK_ID") },
      ],
    },
    {
      name: "ATH Móvil (deshabilitado)",
      required: false,
      vars: [
        { key: "ATH_MOVIL_PUBLIC_TOKEN", present: isPresent("ATH_MOVIL_PUBLIC_TOKEN") },
        { key: "ATH_MOVIL_PRIVATE_TOKEN", present: isPresent("ATH_MOVIL_PRIVATE_TOKEN") },
        { key: "ATH_MOVIL_ENVIRONMENT", present: isPresent("ATH_MOVIL_ENVIRONMENT") },
      ],
    },
  ];

  const warnings: string[] = [];
  let ready = true;

  for (const group of groups) {
    const missing = group.vars.filter((v) => !v.present);
    if (missing.length > 0 && group.required) {
      ready = false;
      warnings.push(`${group.name}: missing required ${missing.map((v) => v.key).join(", ")}`);
    } else if (missing.length > 0 && missing.length < group.vars.length) {
      warnings.push(`${group.name}: partial config — missing ${missing.map((v) => v.key).join(", ")}`);
    }
  }

  return { groups, ready, warnings };
}

export function paypalConfigured(): boolean {
  return isPresent("PAYPAL_CLIENT_ID") && isPresent("PAYPAL_CLIENT_SECRET");
}

export function athMovilConfigured(): boolean {
  return isPresent("ATH_MOVIL_PUBLIC_TOKEN") && isPresent("ATH_MOVIL_PRIVATE_TOKEN");
}

export function resendConfigured(): boolean {
  return isPresent("RESEND_API_KEY") && isPresent("RESEND_FROM_EMAIL");
}
