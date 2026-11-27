# Phase 8 Rollback Plan

## When to Rollback

- The Phase 8 deploy introduces a regression visible to customers
- The database migration causes errors or data corruption
- The client requests reverting the recipe order

## Frontend Rollback

Revert the Phase 8 commit and push:

```bash
git revert <phase-8-commit-hash>
git push origin main
```

This triggers an automatic Netlify redeploy with the previous code.

## Database Rollback

Run the following SQL in the Supabase SQL Editor. This removes recipe-to-day assignments and deletes the 9 skeleton recipes added in migration 005.

**This does NOT delete customer data, orders, payments, or access tokens.**

```sql
BEGIN;

-- Remove recipe assignments from calendar days
UPDATE calendar_days
SET recipe_id = NULL, title = NULL
WHERE day_number BETWEEN 1 AND 13;

-- Restore Day 14 original assignment (coquito was already assigned in 002_seed_data.sql)
-- Day 14 keeps its assignment; only reset if necessary:
-- UPDATE calendar_days SET recipe_id = NULL, title = NULL WHERE day_number = 14;

-- Delete the 9 skeleton recipes (no content, no foreign key references)
DELETE FROM recipes WHERE slug IN (
  'galletas-de-fresa-y-gotitas-de-chocolate',
  'galletas-de-doble-chocolate',
  'limonada-de-fresa',
  'galletas-de-polvo-de-fresas',
  'bizcocho-de-chocolate-con-harina-swans-down',
  'las-mejores-galletas-de-chocolate-chips',
  'frosting-de-chocolate',
  'dip-cremoso-de-chocolate',
  'galletas-de-oreo-y-chocolate-chips'
);

COMMIT;
```

### Verify rollback

```sql
-- Should show 14 rows; days 1-13 with NULL recipe_id
SELECT day_number, recipe_id, title FROM calendar_days ORDER BY day_number;

-- Should show only the original 5 recipes
SELECT slug, title FROM recipes ORDER BY slug;
```

## Partial Rollback

If only specific day assignments need correcting, update individual rows:

```sql
UPDATE calendar_days
SET recipe_id = NULL, title = NULL
WHERE day_number = <day>;
```

## Notes

- Skeleton recipes have no ingredients, videos, or steps — they are inert and do not affect the customer experience if left in the database.
- Customer access tokens and purchase records reference orders, not recipes, so recipe changes do not invalidate existing purchases.
- If the client provided recipe content that was added to skeleton recipes via the admin dashboard, deleting those recipes will lose that content. Export first if needed.
