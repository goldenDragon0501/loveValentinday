import { describe, it, expect } from "vitest";
import { rateLimitHeaders } from "../netlify/functions/lib/rate-limit";

describe("rateLimitHeaders", () => {
  it("returns Retry-After and X-RateLimit-Remaining headers", () => {
    const headers = rateLimitHeaders(60);
    expect(headers["Retry-After"]).toBe("60");
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
  });

  it("converts numeric retryAfter to string", () => {
    const headers = rateLimitHeaders(300);
    expect(headers["Retry-After"]).toBe("300");
  });
});
