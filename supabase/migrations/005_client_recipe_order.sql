-- 005_client_recipe_order.sql
-- Implements the client's final 14-recipe sequence (ORDEN DE LAS RECETAS.docx).
-- Inserts 9 new skeleton recipes (content pending from client) and assigns
-- all 14 recipes to their calendar days.
-- Safe to run repeatedly (INSERT ... ON CONFLICT DO NOTHING, idempotent UPDATEs).
--
-- Rollback strategy: re-run with the previous day assignments, or restore
-- from a database backup taken before this migration.

BEGIN;

-- ───────── Insert 9 new skeleton recipes ─────────
-- Content (ingredients, steps, videos) is intentionally empty.
-- The client must provide this material before launch.

INSERT INTO recipes (slug, title, category) VALUES
  ('galletas-de-fresa-y-gotitas-de-chocolate', 'Galletas de fresa y gotitas de chocolate', 'dessert'),
  ('galletas-de-doble-chocolate', 'Galletas de doble chocolate', 'dessert'),
  ('limonada-de-fresa', 'Limonada de fresa', 'beverage'),
  ('galletas-de-polvo-de-fresas', 'Galletas de polvo de fresas', 'dessert'),
  ('bizcocho-de-chocolate-con-harina-swans-down', 'Bizcocho de chocolate con harina Swans Down', 'dessert'),
  ('las-mejores-galletas-de-chocolate-chips', 'Las mejores galletas de chocolate chips', 'dessert'),
  ('frosting-de-chocolate', 'Frosting de chocolate', 'dessert'),
  ('dip-cremoso-de-chocolate', 'Dip cremoso de chocolate 1 y 2', 'dessert'),
  ('galletas-de-oreo-y-chocolate-chips', 'Galletas de Oreo y chocolate chips', 'dessert')
ON CONFLICT (slug) DO NOTHING;

-- ───────── Assign recipes to calendar days ─────────
-- Day → recipe mapping from the client's ORDEN DE LAS RECETAS.docx.
-- Day 1: Bizcocho sin harina
-- Day 2: Galletas de fresa y gotitas de chocolate
-- Day 3: Los mejores mini cheesecakes de chocolate
-- Day 4: Cupcakes de chocolate y guineo
-- Day 5: Galletas de doble chocolate
-- Day 6: Mantequilla de chocolate
-- Day 7: Limonada de fresa
-- Day 8: Galletas de polvo de fresas
-- Day 9: Bizcocho de chocolate con harina Swans Down
-- Day 10: Las mejores galletas de chocolate chips
-- Day 11: Frosting de chocolate
-- Day 12: Dip cremoso de chocolate 1 y 2
-- Day 13: Galletas de Oreo y chocolate chips
-- Day 14: Super coquito de Nutella (closing special)

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'bizcocho-de-chocolate-sin-harina'),
  title = 'Bizcocho de chocolate sin harina',
  kind = 'recipe'
WHERE day_number = 1;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'galletas-de-fresa-y-gotitas-de-chocolate'),
  title = 'Galletas de fresa y gotitas de chocolate',
  kind = 'recipe'
WHERE day_number = 2;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'mini-cheesecakes-de-chocolate'),
  title = 'Los mejores mini cheesecakes de chocolate',
  kind = 'recipe'
WHERE day_number = 3;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'cupcakes-de-chocolate-y-guineo'),
  title = 'Cupcakes de chocolate y guineo',
  kind = 'recipe'
WHERE day_number = 4;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'galletas-de-doble-chocolate'),
  title = 'Galletas de doble chocolate',
  kind = 'recipe'
WHERE day_number = 5;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'mantequilla-de-chocolate'),
  title = 'Mantequilla de chocolate',
  kind = 'recipe'
WHERE day_number = 6;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'limonada-de-fresa'),
  title = 'Limonada de fresa',
  kind = 'recipe'
WHERE day_number = 7;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'galletas-de-polvo-de-fresas'),
  title = 'Galletas de polvo de fresas',
  kind = 'recipe'
WHERE day_number = 8;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'bizcocho-de-chocolate-con-harina-swans-down'),
  title = 'Bizcocho de chocolate con harina Swans Down',
  kind = 'recipe'
WHERE day_number = 9;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'las-mejores-galletas-de-chocolate-chips'),
  title = 'Las mejores galletas de chocolate chips',
  kind = 'recipe'
WHERE day_number = 10;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'frosting-de-chocolate'),
  title = 'Frosting de chocolate',
  kind = 'recipe'
WHERE day_number = 11;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'dip-cremoso-de-chocolate'),
  title = 'Dip cremoso de chocolate 1 y 2',
  kind = 'recipe'
WHERE day_number = 12;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'galletas-de-oreo-y-chocolate-chips'),
  title = 'Galletas de Oreo y chocolate chips',
  kind = 'recipe'
WHERE day_number = 13;

UPDATE calendar_days SET
  recipe_id = (SELECT id FROM recipes WHERE slug = 'super-coquito-de-nutella'),
  title = 'Super coquito de Nutella',
  kind = 'special'
WHERE day_number = 14;

COMMIT;
