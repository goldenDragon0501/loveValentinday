# Missing Material Report — Phase 8

**Date:** 2026-11-26
**Phase:** 8 — Calendar Finalization and Functional Integration

## Summary

Of the 14 recipes in the client's final sequence (ORDEN DE LAS RECETAS.docx), **5 have content** and **9 are skeleton entries** awaiting material from the client. Additionally, 1 existing recipe (Super coquito de Nutella) has a video but is missing its ingredient list.

## Recipes with Complete Content

| Day | Recipe | Ingredients | Videos | Steps/Notes |
|-----|--------|-------------|--------|-------------|
| 1 | Bizcocho de chocolate sin harina | 1 group (5 items) | 1 video | 6 steps, 4 notes |
| 3 | Los mejores mini cheesecakes de chocolate | 3 groups (Crust, Relleno, Ganache) | 2 videos | Baking instructions |
| 4 | Cupcakes de chocolate y guineo | 1 group (11 items) | 2 videos | Baking instructions |
| 6 | Mantequilla de chocolate | 2 groups (6 + 3 items) | 1 video | — |
| 14 | Super coquito de Nutella | **MISSING** | 1 video (KvAklBTkOPc) | — |

## Recipes Missing ALL Content (skeleton entries)

These recipes were created as skeletons per the client's ORDEN DE LAS RECETAS.docx. They need **ingredients, preparation steps, baking instructions, notes, and YouTube video IDs** from the client before they can be displayed in the calendar.

| Day | Recipe | What's Needed |
|-----|--------|---------------|
| 2 | Galletas de fresa y gotitas de chocolate | Ingredients, steps, video(s) |
| 5 | Galletas de doble chocolate | Ingredients, steps, video(s) |
| 7 | Limonada de fresa | Ingredients, steps, video(s) |
| 8 | Galletas de polvo de fresas | Ingredients, steps, video(s) |
| 9 | Bizcocho de chocolate con harina Swans Down | Ingredients, steps, video(s) |
| 10 | Las mejores galletas de chocolate chips | Ingredients, steps, video(s) |
| 11 | Frosting de chocolate | Ingredients, steps, video(s) |
| 12 | Dip cremoso de chocolate 1 y 2 | Ingredients, steps, video(s) |
| 13 | Galletas de Oreo y chocolate chips | Ingredients, steps, video(s) |

## Partially Complete Recipe

| Day | Recipe | What's Present | What's Missing |
|-----|--------|----------------|----------------|
| 14 | Super coquito de Nutella | Title, YouTube video (KvAklBTkOPc), Day 14 plan | Ingredient list |

## Impact

- **Calendar page:** Days with skeleton recipes will display only the title and day number. No ingredients, steps, or videos will appear until the client provides the material.
- **Homepage:** Only recipes with both videos AND ingredients appear in the preview cards (Days 1, 3, 4, 6). Skeleton recipes are excluded automatically.
- **Admin dashboard:** Admins can populate recipe content via the Recetas tab once material is received.

## Action Required

The client must provide for each of the 9 missing recipes:
1. **Ingredient list** with groups and quantities
2. **Preparation steps** (numbered, in order)
3. **Baking instructions** (temperature, time)
4. **YouTube video ID(s)** for the step-by-step video(s)
5. **Notes** (optional tips)

For Super coquito de Nutella:
1. **Ingredient list** (can be retrieved from the YouTube video description for KvAklBTkOPc)

Content can be added via:
- The admin dashboard (Recetas tab)
- Direct database INSERT via Supabase SQL Editor
- A future migration file once material is received
