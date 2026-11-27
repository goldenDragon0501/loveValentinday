# Phase 8 Deployment Guide

Netlify is currently out of deployment credits. Follow these steps once credits are restored.

## Pre-Deploy Checklist

- [ ] Confirm all Phase 8 changes are committed and pushed to `main`
- [ ] Run database migration `005_client_recipe_order.sql` on the production Supabase instance
- [ ] Verify these Netlify environment variables are set:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only |
| `ADMIN_SECRET` | Yes | JWT secret for admin auth |
| `PAYPAL_CLIENT_ID` | For PayPal | Sandbox or production |
| `PAYPAL_CLIENT_SECRET` | For PayPal | Sandbox or production |
| `PAYPAL_ENVIRONMENT` | For PayPal | `sandbox` or `production` |
| `PAYPAL_WEBHOOK_ID` | For PayPal | From PayPal developer dashboard |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Verified sender address |
| `RESEND_FROM_NAME` | For email | e.g. `14 días de dulce amor` |
| `CRON_SECRET` | Optional | Auth for email queue cron |
| `ATH_MOVIL_PUBLIC_TOKEN` | For ATH | When merchant credentials are available |
| `ATH_MOVIL_PRIVATE_TOKEN` | For ATH | When merchant credentials are available |

## Run Database Migration

In the Supabase dashboard SQL Editor, run the full contents of `supabase/migrations/005_client_recipe_order.sql`. This:

1. Inserts 9 new skeleton recipes
2. Assigns all 14 recipes to their calendar days in the client's approved order
3. Runs inside a transaction (atomic)
4. Is safe to run repeatedly (uses `ON CONFLICT DO NOTHING` and idempotent `UPDATE`)

**Verify** after running:

```sql
SELECT day_number, title, kind
FROM calendar_days
ORDER BY day_number;
```

All 14 days should have titles matching the client's ORDEN DE LAS RECETAS.docx.

## Deploy Steps

1. Push to `main` triggers an automatic Netlify deploy.
2. Alternatively, in Netlify dashboard: **Deploys** > **Trigger deploy** > **Deploy site**.
3. Wait for the build to complete (~2 minutes).

## Post-Deploy Verification

1. **Homepage**: Visit https://lovevalentinday.netlify.app/ — recipe cards should show only recipes with content (Days 1, 3, 4, 6).
2. **Calendar status**: Visit `/.netlify/functions/calendar-status` — should return JSON with server time and calendar configuration.
3. **Admin login**: Visit `/admin/` and log in. Check the Calendario tab shows all 14 days with correct titles.
4. **Day 14**: In the Calendario tab, Day 14 should show "Super coquito de Nutella" with kind "special".

## Rollback

See `docs/PHASE_8_ROLLBACK_PLAN.md` for detailed rollback instructions covering both frontend and database changes.

**Quick rollback**: revert the Phase 8 git commit and trigger a redeploy. Database changes do not need to be rolled back unless new skeleton recipes cause issues (they are inert without content).
