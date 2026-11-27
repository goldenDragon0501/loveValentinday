import { describe, it, expect } from "vitest";
import { schedule, recipes, day14Plan, preview } from "../src/content/site";

const CLIENT_ORDER = [
  { day: 1, title: "Bizcocho de chocolate sin harina", slug: "bizcocho-de-chocolate-sin-harina" },
  { day: 2, title: "Galletas de fresa y gotitas de chocolate", slug: "galletas-de-fresa-y-gotitas-de-chocolate" },
  { day: 3, title: "Los mejores mini cheesecakes de chocolate", slug: "mini-cheesecakes-de-chocolate" },
  { day: 4, title: "Cupcakes de chocolate y guineo", slug: "cupcakes-de-chocolate-y-guineo" },
  { day: 5, title: "Galletas de doble chocolate", slug: "galletas-de-doble-chocolate" },
  { day: 6, title: "Mantequilla de chocolate", slug: "mantequilla-de-chocolate" },
  { day: 7, title: "Limonada de fresa", slug: "limonada-de-fresa" },
  { day: 8, title: "Galletas de polvo de fresas", slug: "galletas-de-polvo-de-fresas" },
  { day: 9, title: "Bizcocho de chocolate con harina Swans Down", slug: "bizcocho-de-chocolate-con-harina-swans-down" },
  { day: 10, title: "Las mejores galletas de chocolate chips", slug: "las-mejores-galletas-de-chocolate-chips" },
  { day: 11, title: "Frosting de chocolate", slug: "frosting-de-chocolate" },
  { day: 12, title: "Dip cremoso de chocolate 1 y 2", slug: "dip-cremoso-de-chocolate" },
  { day: 13, title: "Galletas de Oreo y chocolate chips", slug: "galletas-de-oreo-y-chocolate-chips" },
  { day: 14, title: "Super coquito de Nutella", slug: "super-coquito-de-nutella" },
];

describe("Phase 8: Client recipe order (schedule)", () => {
  it("has exactly 14 days in the schedule", () => {
    expect(schedule).toHaveLength(14);
  });

  it("matches the client's exact recipe sequence", () => {
    for (let i = 0; i < 14; i++) {
      expect(schedule[i].recipeSlug, `Day ${i + 1} slug`).toBe(CLIENT_ORDER[i].slug);
      expect(schedule[i].title, `Day ${i + 1} title`).toBe(CLIENT_ORDER[i].title);
    }
  });

  it("every schedule entry has a non-null title", () => {
    for (const day of schedule) {
      expect(day.title).toBeTruthy();
    }
  });

  it("every schedule entry has a recipeSlug", () => {
    for (const day of schedule) {
      expect(day.recipeSlug).toBeTruthy();
    }
  });

  it("schedule slugs are all unique", () => {
    const slugs = schedule.map((d) => d.recipeSlug);
    expect(new Set(slugs).size).toBe(14);
  });

  it("Day 14 is the special coquito closing", () => {
    const day14 = schedule[13];
    expect(day14.title).toBe("Super coquito de Nutella");
    expect(day14.kind).toBe("special");
    expect(day14.recipeSlug).toBe("super-coquito-de-nutella");
  });

  it("days 1-13 are kind 'recipe'", () => {
    for (let i = 0; i < 13; i++) {
      expect(schedule[i].kind).toBe("recipe");
    }
  });

  it("every schedule slug has a matching recipe in the recipes array", () => {
    const recipeSlugs = new Set(recipes.map((r) => r.slug));
    for (const day of schedule) {
      expect(recipeSlugs.has(day.recipeSlug), `Missing recipe: ${day.recipeSlug}`).toBe(true);
    }
  });
});

describe("Phase 8: Recipes array", () => {
  it("has exactly 14 recipes", () => {
    expect(recipes).toHaveLength(14);
  });

  it("all recipe slugs are unique", () => {
    const slugs = recipes.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(14);
  });

  it("every recipe has a title and slug", () => {
    for (const r of recipes) {
      expect(r.slug).toBeTruthy();
      expect(r.title).toBeTruthy();
    }
  });

  it("coquito (Day 14) has the correct YouTube video ID", () => {
    const coquito = recipes.find((r) => r.slug === "super-coquito-de-nutella");
    expect(coquito).toBeDefined();
    expect(coquito!.videos).toHaveLength(1);
    expect(coquito!.videos[0].id).toBe("KvAklBTkOPc");
  });

  it("existing recipes retain their content", () => {
    const bizcocho = recipes.find((r) => r.slug === "bizcocho-de-chocolate-sin-harina");
    expect(bizcocho).toBeDefined();
    expect(bizcocho!.groups.length).toBeGreaterThan(0);
    expect(bizcocho!.steps!.length).toBeGreaterThan(0);
    expect(bizcocho!.notes!.length).toBeGreaterThan(0);

    const cheesecakes = recipes.find((r) => r.slug === "mini-cheesecakes-de-chocolate");
    expect(cheesecakes).toBeDefined();
    expect(cheesecakes!.groups.length).toBeGreaterThan(0);
    expect(cheesecakes!.videos.length).toBeGreaterThan(0);

    const cupcakes = recipes.find((r) => r.slug === "cupcakes-de-chocolate-y-guineo");
    expect(cupcakes).toBeDefined();
    expect(cupcakes!.bake!.length).toBeGreaterThan(0);

    const mantequilla = recipes.find((r) => r.slug === "mantequilla-de-chocolate");
    expect(mantequilla).toBeDefined();
    expect(mantequilla!.groups.length).toBeGreaterThan(0);
  });

  it("Day 12 (dip cremoso) title includes both parts", () => {
    const dip = recipes.find((r) => r.slug === "dip-cremoso-de-chocolate");
    expect(dip).toBeDefined();
    expect(dip!.title).toContain("1 y 2");
  });

  it("new skeleton recipes have empty groups and videos", () => {
    const skeletonSlugs = [
      "galletas-de-fresa-y-gotitas-de-chocolate",
      "galletas-de-doble-chocolate",
      "limonada-de-fresa",
      "galletas-de-polvo-de-fresas",
      "bizcocho-de-chocolate-con-harina-swans-down",
      "las-mejores-galletas-de-chocolate-chips",
      "frosting-de-chocolate",
      "dip-cremoso-de-chocolate",
      "galletas-de-oreo-y-chocolate-chips",
    ];
    for (const slug of skeletonSlugs) {
      const recipe = recipes.find((r) => r.slug === slug);
      expect(recipe, `recipe ${slug} should exist`).toBeDefined();
      expect(recipe!.groups).toHaveLength(0);
      expect(recipe!.videos).toHaveLength(0);
    }
  });
});

describe("Phase 8: Day 14 closing plan", () => {
  it("has a title and intro", () => {
    expect(day14Plan.title).toBeTruthy();
    expect(day14Plan.intro).toBeTruthy();
  });

  it("has at least 3 steps", () => {
    expect(day14Plan.steps.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Phase 8: Preview configuration", () => {
  it("preview references an existing recipe slug", () => {
    const slugs = recipes.map((r) => r.slug);
    expect(slugs).toContain(preview.recipe);
  });

  it("preview references the Day 1 recipe", () => {
    expect(preview.recipe).toBe("bizcocho-de-chocolate-sin-harina");
  });
});
