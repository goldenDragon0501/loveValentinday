# Production Checklist

> Updated for Phase 9 — Manual Sales Model

## Pre-Deploy

- [ ] All Supabase migrations applied (001 through 006)
- [ ] Admin user created in `admin_users` table (see SUPABASE_SETUP.md § 6)
- [ ] All required environment variables set in Netlify
- [ ] Client contact information configured in `site.ts` (WhatsApp, email, Instagram)

## Database Migrations

Run in order in Supabase SQL Editor:

1. `001_initial_schema.sql` — Tables, indexes, RLS policies
2. `002_seed_data.sql` — Default calendar days, seed product
3. `003_security_hardening.sql` — Rate limits, email queue, settings, finalize_payment()
4. `004_security_search_path.sql` — Function search path hardening
5. `005_client_recipe_order.sql` — 14-recipe sequence per client order
6. `006_manual_sales.sql` — Manual access grants (nullable order_id, grant_type, granted_by)

## Required Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- [ ] `ADMIN_SECRET` — Secret for admin JWT signing

## Optional Environment Variables

- [ ] `RESEND_API_KEY` — Resend API key (for email delivery)
- [ ] `RESEND_FROM_EMAIL` — Verified sender email
- [ ] `RESEND_FROM_NAME` — Sender display name
- [ ] `PUBLIC_URL` — Production site URL (for access links)
- [ ] `CRON_SECRET` — Secret for email queue cron

## Disabled (Not Required)

PayPal, ATH Móvil and Zelle credentials are **not required**. Payment endpoints return HTTP 410.

## Client Configuration Required

- [ ] WhatsApp number added to `site.contact.whatsapp` in `site.ts`
- [ ] Email added to `site.contact.email` in `site.ts`
- [ ] Instagram handle added to `site.contact.instagram` in `site.ts`
- [ ] Product price set in `site.price` in `site.ts`
- [ ] Missing recipe content provided for 11 of 14 recipes (videos, ingredients, steps)

## Admin Dashboard

- [ ] Login works at `/admin`
- [ ] Resumen tab shows stats
- [ ] Clientes tab: can register customer, generate access link, copy link
- [ ] Can search and view customer details
- [ ] Can revoke and regenerate access links

## Email (Optional)

- [ ] Resend account active
- [ ] Sender domain verified in Resend
- [ ] Test email sent successfully
- [ ] Email queue cron configured (if using email delivery)

## Calendar Content

- [ ] All 14 days have recipes assigned in correct order
- [ ] Recipe content verified (ingredients, steps, videos) — 11 recipes pending content
- [ ] Day 12 contains both parts of Dip cremoso de chocolate
- [ ] Day 14 contains Super coquito de Nutella with YouTube video
- [ ] No placeholder or test data in published recipes

## Functional Tests

- [ ] Homepage loads correctly
- [ ] `/comprar` page shows contact buttons (WhatsApp, email, Instagram)
- [ ] Admin can register a customer and generate access link
- [ ] Customer can access calendar via link
- [ ] Calendar page shows locked/unlocked days based on date
- [ ] Day content loads for unlocked days with valid access
- [ ] Access recovery email works (if Resend configured)
- [ ] Admin can revoke and regenerate customer access

## Security

- [ ] No secrets in client-side code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not in frontend bundle
- [ ] Rate limiting active on admin endpoints
- [ ] Admin endpoints require authentication
- [ ] Payment endpoints return 410 (cannot bypass to create unauthorized access)
- [ ] CORS headers restrict origins appropriately

## Post-Deploy

- [ ] Verify site loads at production URL
- [ ] Check Netlify Functions logs for errors
- [ ] Monitor Supabase dashboard for query errors
- [ ] Complete one end-to-end manual sale (register customer → access link → calendar)
- [ ] Verify email delivery (if Resend configured)
