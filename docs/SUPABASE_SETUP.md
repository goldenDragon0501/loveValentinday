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
# 2. Run 002_audit_and_access.sql
# 3. Run 003_security_hardening.sql
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

After running migrations, the `app_settings` table is seeded with defaults. Use the admin dashboard (Configuracion tab) to set:

- Product price (in USD, stored as integer cents)
- Sales enabled/disabled
- Payment method toggles
- Zelle recipient information

## 6. Create Admin User

Insert an admin into the `admins` table:

```sql
INSERT INTO admins (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  crypt('your-secure-password', gen_salt('bf')),
  'Admin',
  'super_admin'
);
```
