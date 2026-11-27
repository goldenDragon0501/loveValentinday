import { describe, it, expect, vi } from "vitest";

vi.stubEnv("CALENDAR_YEAR", "2027");
vi.stubEnv("CALENDAR_OPEN_HOUR", "8");
vi.stubEnv("CALENDAR_TIMEZONE", "America/Puerto_Rico");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "placeholder");

const { getUnlockTime, getUnlockedDays, nextUnlockTime, getCalendarYear, getCalendarOpenHour } =
  await import("../netlify/functions/lib/supabase");

describe("Calendar Configuration", () => {
  it("uses 2027 as the calendar year", () => {
    expect(getCalendarYear()).toBe(2027);
  });

  it("uses 8 AM as the open hour", () => {
    expect(getCalendarOpenHour()).toBe(8);
  });
});

describe("getUnlockTime", () => {
  it("returns 8:00 AM AST (UTC-4) for day 1", () => {
    const t = getUnlockTime(1);
    expect(t.toISOString()).toBe("2027-02-01T12:00:00.000Z");
  });

  it("returns 8:00 AM AST (UTC-4) for day 14", () => {
    const t = getUnlockTime(14);
    expect(t.toISOString()).toBe("2027-02-14T12:00:00.000Z");
  });

  it("generates sequential daily unlock times", () => {
    const times = Array.from({ length: 14 }, (_, i) => getUnlockTime(i + 1).getTime());
    for (let i = 1; i < times.length; i++) {
      const diff = times[i] - times[i - 1];
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("pads single-digit days correctly", () => {
    const t = getUnlockTime(3);
    expect(t.toISOString()).toContain("2027-02-03");
  });
});

describe("getUnlockedDays", () => {
  it("returns empty array before calendar starts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-31T12:00:00Z"));
    expect(getUnlockedDays()).toEqual([]);
    vi.useRealTimers();
  });

  it("returns [1] after day 1 unlocks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-02-01T12:01:00Z"));
    expect(getUnlockedDays()).toEqual([1]);
    vi.useRealTimers();
  });

  it("returns all 14 days after day 14 unlocks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-02-14T13:00:00Z"));
    const days = getUnlockedDays();
    expect(days).toHaveLength(14);
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    vi.useRealTimers();
  });

  it("returns 7 days at midpoint", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-02-07T14:00:00Z"));
    expect(getUnlockedDays()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    vi.useRealTimers();
  });
});

describe("nextUnlockTime", () => {
  it("returns day 1 unlock before calendar starts", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-15T00:00:00Z"));
    const next = nextUnlockTime();
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2027-02-01T12:00:00.000Z");
    vi.useRealTimers();
  });

  it("returns null after all days unlocked", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-02-15T00:00:00Z"));
    expect(nextUnlockTime()).toBeNull();
    vi.useRealTimers();
  });

  it("returns day 2 unlock after day 1 is unlocked", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-02-01T13:00:00Z"));
    const next = nextUnlockTime();
    expect(next).not.toBeNull();
    expect(next!.toISOString()).toBe("2027-02-02T12:00:00.000Z");
    vi.useRealTimers();
  });
});
