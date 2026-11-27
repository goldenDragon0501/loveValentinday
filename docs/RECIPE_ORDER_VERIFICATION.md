# Recipe Order Verification

**Source:** ORDEN DE LAS RECETAS.docx (client-provided)
**Phase:** 8

## Final Recipe Sequence

| Day | Date | Recipe | Slug | Content Status |
|-----|------|--------|------|----------------|
| 1 | Feb 1, 2027 | Bizcocho de chocolate sin harina | `bizcocho-de-chocolate-sin-harina` | Complete (ingredients, 1 video, 6 steps, 4 notes) |
| 2 | Feb 2, 2027 | Galletas de fresa y gotitas de chocolate | `galletas-de-fresa-y-gotitas-de-chocolate` | Skeleton — awaiting client content |
| 3 | Feb 3, 2027 | Los mejores mini cheesecakes de chocolate | `mini-cheesecakes-de-chocolate` | Complete (3 ingredient groups, 2 videos, baking instructions) |
| 4 | Feb 4, 2027 | Cupcakes de chocolate y guineo | `cupcakes-de-chocolate-y-guineo` | Complete (ingredients, 2 videos, baking instructions) |
| 5 | Feb 5, 2027 | Galletas de doble chocolate | `galletas-de-doble-chocolate` | Skeleton — awaiting client content |
| 6 | Feb 6, 2027 | Mantequilla de chocolate | `mantequilla-de-chocolate` | Complete (2 ingredient groups, 1 video) |
| 7 | Feb 7, 2027 | Limonada de fresa | `limonada-de-fresa` | Skeleton — awaiting client content |
| 8 | Feb 8, 2027 | Galletas de polvo de fresas | `galletas-de-polvo-de-fresas` | Skeleton — awaiting client content |
| 9 | Feb 9, 2027 | Bizcocho de chocolate con harina Swans Down | `bizcocho-de-chocolate-con-harina-swans-down` | Skeleton — awaiting client content |
| 10 | Feb 10, 2027 | Las mejores galletas de chocolate chips | `las-mejores-galletas-de-chocolate-chips` | Skeleton — awaiting client content |
| 11 | Feb 11, 2027 | Frosting de chocolate | `frosting-de-chocolate` | Skeleton — awaiting client content |
| 12 | Feb 12, 2027 | Dip cremoso de chocolate 1 y 2 | `dip-cremoso-de-chocolate` | Skeleton — awaiting client content |
| 13 | Feb 13, 2027 | Galletas de Oreo y chocolate chips | `galletas-de-oreo-y-chocolate-chips` | Skeleton — awaiting client content |
| 14 | Feb 14, 2027 | Super coquito de Nutella | `super-coquito-de-nutella` | Partial (1 video KvAklBTkOPc, missing ingredients) |

## Frontend Verification

The `schedule` array in `Code/site/src/content/site.ts` defines the calendar order. Each entry has a `title`, `kind`, and `recipeSlug` that must match the table above. The `recipes` array in the same file contains 14 entries, one per slug.

Automated tests in `Code/site/tests/phase8-recipe-order.test.ts` verify:
- Exactly 14 days in the schedule
- Exact title and slug match for every day
- All slugs are unique
- Every slug references an existing recipe
- Day 14 is kind `special`; days 1–13 are kind `recipe`
- Existing recipes retain their content (ingredients, videos, steps)
- New skeleton recipes have empty groups and videos
- Day 12 title includes "1 y 2"
- Preview references Day 1 recipe

## Database Verification

After running migration `005_client_recipe_order.sql`, execute this query in the Supabase SQL Editor to confirm all assignments:

```sql
SELECT
  cd.day_number,
  cd.title AS calendar_title,
  cd.kind,
  r.slug,
  r.title AS recipe_title,
  CASE
    WHEN EXISTS (SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) THEN 'has ingredients'
    ELSE 'no ingredients'
  END AS ingredient_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM recipe_videos rv WHERE rv.recipe_id = r.id) THEN 'has videos'
    ELSE 'no videos'
  END AS video_status
FROM calendar_days cd
LEFT JOIN recipes r ON r.id = cd.recipe_id
ORDER BY cd.day_number;
```

Expected result: 14 rows, each with a non-null recipe slug, matching the table above.

### Quick count check

```sql
SELECT COUNT(*) AS total_days FROM calendar_days WHERE recipe_id IS NOT NULL;
-- Expected: 14

SELECT COUNT(*) AS total_recipes FROM recipes;
-- Expected: 14 (5 original + 9 new skeletons)
```

### Duplicate assignment check

```sql
SELECT recipe_id, COUNT(*) AS assigned_days
FROM calendar_days
WHERE recipe_id IS NOT NULL
GROUP BY recipe_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no recipe assigned to multiple days)
```
