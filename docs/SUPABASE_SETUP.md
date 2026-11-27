# Supabase Setup

## 1. Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon key** (safe for frontend).
3. Note your **service_role key** (server-only, never expose to frontend).

## 2. Run Migrations

Apply the SQL migrations in order from `supabase/migrations/`:

```bash
# Using Supabase CLI
supabase db push

# Or manually in the SQL Editor (Dashboard > SQL Editor):
# 1. Run 001_initial_schema.sql
# 2. Run 002_seed_data.sql
# 3. Run 003_security_hardening.sql
# 4. Run 004_security_search_path.sql
# 5. Run 005_client_recipe_order.sql
# 6. Run 006_manual_sales.sql
```

### Migration 003 creates:

- `app_settings` table with 14 default configuration values
- `products.price_cents` and `products.sales_enabled` columns
- `rate_limits` table for distributed rate limiting
- `email_queue` table with retry logic
- `webhook_events` table for idempotent webhook processing
- `customer_access.token_hash` column for secure token storage
- Atomic `finalize_payment()` PostgreSQL function
- `check_rate_limit()`, `get_setting()`, `set_setting()`, `claim_pending_emails()` functions

### Migration 006 creates:

- Makes `customer_access.order_id` nullable (for manual access grants without an order)
- Adds `grant_type` column (`TEXT NOT NULL DEFAULT 'payment'`) to distinguish automated vs manual access
- Adds `granted_by` column (`UUID REFERENCES admin_users`) to track which admin granted access
- Adds `grant_notes` column (`TEXT`) for optional notes on manual grants

## 3. Configure Environment Variables

Set in Netlify (Site > Environment variables):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |

## 4. Row Level Security

RLS is enabled on all tables. The Netlify Functions use the `service_role` key which bypasses RLS. The frontend uses the `anon` key with RLS policies.

## 5. Initial Configuration

After running migrations, the `app_settings` table is seeded with defaults. Use the admin dashboard (Configuración tab) to set:

- Product price (in USD, stored as integer cents)
- Sales enabled/disabled

Note: Automated payment methods (PayPal, ATH Móvil, Zelle) were disabled in Phase 9. The manual sales model is now active — customers are registered directly by the admin via the Clientes tab.

## 6. Create Admin User

Admin authentication uses Supabase Auth. First create an auth user, then link it to the `admin_users` table.

### Step 1: Create Auth User

In the Supabase dashboard, go to **Authentication** > **Users** > **Add user** > **Create new user**. Enter your admin email and password. Copy the **User UID**.

### Step 2: Insert Admin Record

```sql
INSERT INTO admin_users (auth_user_id, name, role)
VALUES (
  'PASTE-YOUR-USER-UID-HERE',
  'Admin',
  'superadmin'
);
```
