-- 001_initial_schema.sql
-- Database schema for "14 días de dulce amor" Valentine's Day Calendar
-- Run against a Supabase PostgreSQL database.

-- ───────── Customers ─────────
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_email ON customers (email);

-- ───────── Products ─────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────── Orders ─────────
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  reference TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'awaiting_verification', 'paid', 'failed', 'cancelled', 'refunded')),
  total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('ath_movil', 'paypal', 'zelle')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_reference ON orders (reference);

-- ───────── Payments ─────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('ath_movil', 'paypal', 'zelle')),
  external_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  raw_response JSONB,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order ON payments (order_id);
CREATE INDEX idx_payments_external ON payments (external_id);

-- ───────── Recipes ─────────
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'dessert'
    CHECK (category IN ('dessert', 'beverage', 'meal', 'special')),
  description TEXT,
  preparation_steps TEXT[],
  baking_instructions TEXT[],
  notes TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recipes_slug ON recipes (slug);
CREATE INDEX idx_recipes_category ON recipes (category);

-- ───────── Recipe Ingredients ─────────
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  group_name TEXT,
  item TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe_id);

-- ───────── Recipe Videos ─────────
CREATE TABLE recipe_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_recipe_videos_recipe ON recipe_videos (recipe_id);

-- ───────── Recipe Downloads ─────────
CREATE TABLE recipe_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recipe_downloads_recipe ON recipe_downloads (recipe_id);

-- ───────── Calendar Days ─────────
CREATE TABLE calendar_days (
  id SERIAL PRIMARY KEY,
  day_number INTEGER UNIQUE NOT NULL CHECK (day_number BETWEEN 1 AND 14),
  date DATE NOT NULL,
  unlock_time TIMESTAMPTZ NOT NULL,
  recipe_id UUID REFERENCES recipes(id),
  title TEXT,
  kind TEXT NOT NULL DEFAULT 'recipe'
    CHECK (kind IN ('recipe', 'beverage', 'plan', 'special')),
  special_content JSONB,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────── Customer Access ─────────
CREATE TABLE customer_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  access_token TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_access_token ON customer_access (access_token);
CREATE INDEX idx_customer_access_customer ON customer_access (customer_id);

-- ───────── Email Logs ─────────
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  template TEXT NOT NULL,
  subject TEXT NOT NULL,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_logs_customer ON email_logs (customer_id);

-- ───────── Admin Users ─────────
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────── Audit Logs ─────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_admin ON audit_logs (admin_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- ───────── Row Level Security ─────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access to calendar metadata (day numbers, dates, locked status — not recipe content)
CREATE POLICY "Public can read calendar day metadata"
  ON calendar_days FOR SELECT USING (true);

-- Public read access to product info
CREATE POLICY "Public can read active products"
  ON products FOR SELECT USING (active = true);

-- Customers can read their own data
CREATE POLICY "Customers read own data"
  ON customers FOR SELECT USING (auth.uid()::text = id::text);

-- Customers can read their own orders
CREATE POLICY "Customers read own orders"
  ON orders FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth.uid()::text = id::text
  ));

-- Customers can read their own access tokens
CREATE POLICY "Customers read own access"
  ON customer_access FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth.uid()::text = id::text
  ));

-- Service role (Netlify Functions) has full access via service_role key — no additional policies needed.
-- Admin policies: admins can read/write all tables through service_role key in Netlify Functions.

-- ───────── Updated-at trigger ─────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_calendar_days_updated BEFORE UPDATE ON calendar_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
