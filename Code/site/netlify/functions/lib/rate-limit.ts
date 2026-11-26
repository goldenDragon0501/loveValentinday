import { supabaseAdmin, supabaseConfigured } from "./supabase";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  checkout: { maxRequests: 5, windowSeconds: 60 },
  "recover-access": { maxRequests: 3, windowSeconds: 300 },
  "verify-access": { maxRequests: 20, windowSeconds: 60 },
  "day-content": { maxRequests: 30, windowSeconds: 60 },
  "paypal-create": { maxRequests: 5, windowSeconds: 60 },
  "paypal-capture": { maxRequests: 5, windowSeconds: 60 },
  "paypal-webhook": { maxRequests: 50, windowSeconds: 60 },
  "admin-dashboard": { maxRequests: 30, windowSeconds: 60 },
  "admin-orders": { maxRequests: 30, windowSeconds: 60 },
  "admin-recipes": { maxRequests: 30, windowSeconds: 60 },
  "admin-calendar": { maxRequests: 30, windowSeconds: 60 },
  "admin-customers": { maxRequests: 30, windowSeconds: 60 },
  "admin-settings": { maxRequests: 20, windowSeconds: 60 },
};

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function rateLimitHeaders(retryAfter: number): Record<string, string> {
  return {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Remaining": "0",
  };
}

export async function checkRateLimit(
  req: Request,
  endpoint: string,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!supabaseConfigured) {
    return { allowed: true, retryAfter: 0 };
  }

  const config = ENDPOINT_LIMITS[endpoint] ?? { maxRequests: 20, windowSeconds: 60 };
  const ip = getClientIp(req);
  const identifier = `ip:${ip}`;

  try {
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      return { allowed: true, retryAfter: 0 };
    }

    return {
      allowed: data as boolean,
      retryAfter: data ? 0 : config.windowSeconds,
    };
  } catch {
    return { allowed: true, retryAfter: 0 };
  }
}
