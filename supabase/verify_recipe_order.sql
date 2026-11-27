-- Verification script: confirms all 14 recipes are assigned correctly.
-- Run this after applying 005_client_recipe_order.sql.
-- Expected: 14 rows, each with the correct recipe for its day.

SELECT
  cd.day_number,
  cd.title AS calendar_title,
  cd.kind,
  r.slug AS recipe_slug,
  r.title AS recipe_title,
  CASE
    WHEN r.slug IS NULL THEN 'MISSING RECIPE'
    WHEN cd.title IS NULL THEN 'MISSING TITLE'
    ELSE 'OK'
  END AS status
FROM calendar_days cd
LEFT JOIN recipes r ON r.id = cd.recipe_id
ORDER BY cd.day_number;

-- Should return exactly 14 rows, all with status = 'OK':
-- Day 1:  bizcocho-de-chocolate-sin-harina
-- Day 2:  galletas-de-fresa-y-gotitas-de-chocolate
-- Day 3:  mini-cheesecakes-de-chocolate
-- Day 4:  cupcakes-de-chocolate-y-guineo
-- Day 5:  galletas-de-doble-chocolate
-- Day 6:  mantequilla-de-chocolate
-- Day 7:  limonada-de-fresa
-- Day 8:  galletas-de-polvo-de-fresas
-- Day 9:  bizcocho-de-chocolate-con-harina-swans-down
-- Day 10: las-mejores-galletas-de-chocolate-chips
-- Day 11: frosting-de-chocolate
-- Day 12: dip-cremoso-de-chocolate
-- Day 13: galletas-de-oreo-y-chocolate-chips
-- Day 14: super-coquito-de-nutella
