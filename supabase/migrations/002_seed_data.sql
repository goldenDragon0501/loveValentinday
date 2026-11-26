-- 002_seed_data.sql
-- Seed the database with existing verified recipe content.
-- Only includes content confirmed from the client's YouTube channel.

-- Product
INSERT INTO products (name, description, currency, active)
VALUES (
  '14 días de dulce amor',
  'Calendario de San Valentín 2027. 14 días de recetas para endulzar el amor.',
  'USD',
  true
);

-- ───────── Recipes ─────────
INSERT INTO recipes (slug, title, category, baking_instructions, notes) VALUES
(
  'mini-cheesecakes-de-chocolate',
  'Los mejores mini cheesecakes de chocolate',
  'dessert',
  ARRAY[
    'Hornea el crust a 350 °F durante 5 minutos. Deja refrescar.',
    'Hornea el crust con el relleno a 325 °F durante 20 a 25 minutos aproximadamente.'
  ],
  NULL
),
(
  'bizcocho-de-chocolate-sin-harina',
  'Bizcocho de chocolate sin harina',
  'dessert',
  NULL,
  ARRAY[
    'No hagas la prueba del palillo: no va a salir limpio, porque el bizcocho queda húmedo y chocolatoso.',
    'Está listo cuando el centro no se mueva al mover el molde.',
    'Ideal para polvorear una capa fina de azúcar en polvo. Agrégala con el cernidor al momento de esparcirla.',
    'Si usas moldes de 6 pulgadas, el tiempo de horneo es de 25 minutos aproximadamente.'
  ]
),
(
  'mantequilla-de-chocolate',
  'Mantequilla de chocolate',
  'dessert',
  NULL,
  NULL
),
(
  'cupcakes-de-chocolate-y-guineo',
  'Cupcakes de chocolate y guineo',
  'dessert',
  ARRAY['Hornea a 350 °F durante 20 a 22 minutos aproximadamente.'],
  NULL
),
(
  'super-coquito-de-nutella',
  'Super coquito de Nutella',
  'beverage',
  NULL,
  NULL
);

-- Preparation steps for bizcocho
UPDATE recipes SET preparation_steps = ARRAY[
  'Derrite las gotitas de chocolate con la mantequilla. Puedes hacerlo en baño de María o en el microondas durante un minuto o menos. Deja enfriar.',
  'En el envase de la batidora agrega la cocoa con el azúcar y mezcla ligeramente.',
  'Agrega entonces los huevos de uno en uno hasta que estén incorporados.',
  'Añade entonces la mezcla del chocolate con la mantequilla.',
  'Coloca la mezcla en un molde redondo de 8 x 3 pulgadas cubierto con papel encerado (wax) o papel de hornear.',
  'Hornea a 350 °F durante alrededor de 50 minutos aproximadamente.'
] WHERE slug = 'bizcocho-de-chocolate-sin-harina';

-- ───────── Recipe Videos ─────────
INSERT INTO recipe_videos (recipe_id, youtube_id, title, sort_order)
SELECT r.id, v.youtube_id, v.title, v.sort_order
FROM recipes r
JOIN (VALUES
  ('mini-cheesecakes-de-chocolate', 'YE1RcmFqKHE', 'Los mejores mini cheesecakes de chocolate, parte 1', 0),
  ('mini-cheesecakes-de-chocolate', 'm9EkUKJQWDo', 'Los mejores mini cheesecakes de chocolate, parte 2', 1),
  ('bizcocho-de-chocolate-sin-harina', 'aRsS3trRyn4', 'Bizcocho de chocolate sin harina', 0),
  ('mantequilla-de-chocolate', 'iZ64emSEu9s', 'Mantequilla de chocolate', 0),
  ('cupcakes-de-chocolate-y-guineo', '5cao0PVoI0U', 'Cupcakes de chocolate y guineo', 0),
  ('cupcakes-de-chocolate-y-guineo', 'cUZJk2Yl_V4', 'Decorando cupcakes de chocolate y guineo', 1),
  ('super-coquito-de-nutella', 'KvAklBTkOPc', 'Super coquito de Nutella', 0)
) AS v(slug, youtube_id, title, sort_order) ON r.slug = v.slug;

-- ───────── Recipe Ingredients ─────────
-- Mini cheesecakes: Crust
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, 'Crust', i.item, i.ord
FROM recipes r, (VALUES
  ('12 galletas Oreo de chocolate', 0),
  ('2 1/2 cdas. de mantequilla sin sal, derretida', 1)
) AS i(item, ord) WHERE r.slug = 'mini-cheesecakes-de-chocolate';

-- Mini cheesecakes: Relleno
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, 'Relleno', i.item, i.ord
FROM recipes r, (VALUES
  ('1/4 taza de heavy cream', 0),
  ('6 onzas de chocolate semidulce', 1),
  ('12 onzas de queso crema', 2),
  ('1/2 taza de azúcar granulada', 3),
  ('2 huevos grandes', 4),
  ('2 cdtas. de extracto de vainilla', 5),
  ('1 cda. de cocoa sin endulzar para repostería', 6)
) AS i(item, ord) WHERE r.slug = 'mini-cheesecakes-de-chocolate';

-- Mini cheesecakes: Ganache
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, 'Ganache', i.item, i.ord
FROM recipes r, (VALUES
  ('1/4 taza de heavy cream', 0),
  ('3 onzas de chocolate semidulce', 1)
) AS i(item, ord) WHERE r.slug = 'mini-cheesecakes-de-chocolate';

-- Bizcocho sin harina
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, NULL, i.item, i.ord
FROM recipes r, (VALUES
  ('1 taza de gotitas de chocolate semidulce (chocolate chips)', 0),
  ('2 barras de mantequilla', 1),
  ('1 taza de cocoa amarga para repostería', 2),
  ('1 ½ tazas de azúcar', 3),
  ('6 huevos', 4)
) AS i(item, ord) WHERE r.slug = 'bizcocho-de-chocolate-sin-harina';

-- Mantequilla de chocolate
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, NULL, i.item, i.ord
FROM recipes r, (VALUES
  ('4 onzas (1/2 barra) de mantequilla sin sal', 0),
  ('1 cda. de cocoa en polvo para hornear', 1),
  ('1/2 cdta. de canela en polvo', 2),
  ('1/4 cdta. de extracto de vainilla', 3),
  ('1 cdta. de azúcar granulada', 4),
  ('1/4 cdta. de sal', 5)
) AS i(item, ord) WHERE r.slug = 'mantequilla-de-chocolate';

-- Mantequilla de chocolate: Para servir
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, 'Para servir', i.item, i.ord
FROM recipes r, (VALUES
  ('Fresas frescas lavadas y cortadas a gusto', 0),
  ('Galletas dulces de preferencia, tipo María o Graham', 1),
  ('Una tabla de madera para presentar, de preferencia', 2)
) AS i(item, ord) WHERE r.slug = 'mantequilla-de-chocolate';

-- Cupcakes de chocolate y guineo
INSERT INTO recipe_ingredients (recipe_id, group_name, item, sort_order)
SELECT r.id, NULL, i.item, i.ord
FROM recipes r, (VALUES
  ('1 2/3 tazas de harina preparada para bizcocho', 0),
  ('¼ taza de cocoa en polvo para hornear', 1),
  ('½ cdta. de bicarbonato de soda', 2),
  ('½ cdta. de canela en polvo', 3),
  ('¾ taza de chocolate semidulce', 4),
  ('1 ½ tazas de guineos maduros cortados en rueditas', 5),
  ('¾ taza de azúcar morena clara', 6),
  ('½ taza de aceite vegetal', 7),
  ('1/3 taza de crema agria (sour cream)', 8),
  ('2 huevos grandes', 9),
  ('2 cdtas. de extracto de vainilla', 10)
) AS i(item, ord) WHERE r.slug = 'cupcakes-de-chocolate-y-guineo';

-- Super coquito de Nutella: ingredients pending from YouTube description
-- TODO(Pedro): retrieve ingredients from https://youtu.be/KvAklBTkOPc description

-- ───────── Calendar Days ─────────
-- Day 14 is assigned; days 1–13 await the client's final recipe order.
INSERT INTO calendar_days (day_number, date, unlock_time, title, kind, published)
SELECT
  d,
  ('2027-02-01'::date + (d - 1) * interval '1 day')::date,
  ('2027-02-01T08:00:00-04:00'::timestamptz + (d - 1) * interval '1 day'),
  CASE WHEN d = 14 THEN 'Super coquito de Nutella' ELSE NULL END,
  CASE WHEN d = 14 THEN 'special' ELSE 'recipe' END,
  false
FROM generate_series(1, 14) AS d;

-- Link Day 14 to the coquito recipe
UPDATE calendar_days
SET recipe_id = (SELECT id FROM recipes WHERE slug = 'super-coquito-de-nutella')
WHERE day_number = 14;
