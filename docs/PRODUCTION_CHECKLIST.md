# Production Checklist

## Pre-Deploy

- [ ] All Supabase migrations applied (001, 002, 003)
- [ ] Admin user created in `admins` table
- [ ] Product created in `products` table with price_cents set
- [ ] All environment variables set in Netlify

## Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- [ ] `ADMIN_SECRET` — JWT secret for admin auth
- [ ] `PAYPAL_CLIENT_ID` — PayPal REST API client ID
- [ ] `PAYPAL_CLIENT_SECRET` — PayPal REST API client secret
- [ ] `PAYPAL_ENVIRONMENT` — Set to `production` for live
- [ ] `PAYPAL_WEBHOOK_ID` — PayPal webhook ID
- [ ] `RESEND_API_KEY` — Resend API key
- [ ] `RESEND_FROM_EMAIL` — Verified sender email
- [ ] `RESEND_FROM_NAME` — Sender display name
- [ ] `PUBLIC_URL` — Production site URL
- [ ] `CRON_SECRET` — Secret for email queue cron

## PayPal

- [ ] Application created in PayPal Developer Dashboard
- [ ] Webhook configured with correct production URL
- [ ] Webhook events subscribed: CAPTURE.COMPLETED, CAPTURE.DENIED, CAPTURE.REVERSED
- [ ] `PAYPAL_ENVIRONMENT=production`

## Email

- [ ] Resend account active
- [ ] Sender domain verified in Resend
- [ ] Test email sent successfully
- [ ] Email queue cron configured (every 2-5 minutes)

## Admin Dashboard

- [ ] Login works at `/admin`
- [ ] Resumen tab shows stats
- [ ] Can configure product price in Configuracion
- [ ] Sales enabled
- [ ] At least one payment method enabled
- [ ] Zelle recipient info filled (if using Zelle)

## Calendar Content

- [ ] All 14 days have recipes assigned
- [ ] All 14 days marked as published
- [ ] Recipe content verified (ingredients, steps, videos)
- [ ] No placeholder or test data

## Functional Tests

- [ ] Homepage loads correctly
- [ ] `/comprar` page shows product and price
- [ ] PayPal checkout completes (sandbox test first)
- [ ] Customer receives confirmation email with access link
- [ ] Calendar page shows locked days
- [ ] Access token unlocks calendar
- [ ] Day content loads for unlocked days
- [ ] Access recovery email works
- [ ] Admin can approve/reject Zelle orders
- [ ] Admin can revoke/reactivate customer access

## Security

- [ ] No secrets in client-side code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` not in frontend bundle
- [ ] Rate limiting active (test with rapid requests)
- [ ] PayPal webhook signature verification working
- [ ] Admin endpoints require authentication
- [ ] CORS headers restrict origins appropriately

## Post-Deploy

- [ ] Verify site loads at production URL
- [ ] Check Netlify Functions logs for errors
- [ ] Monitor Supabase dashboard for query errors
- [ ] Complete one end-to-end purchase
- [ ] Verify email delivery
