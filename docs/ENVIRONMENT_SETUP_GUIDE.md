# Environment Setup Guide

This document lists every environment variable the application uses, grouped by service. Configure them in Netlify under **Site configuration > Environment variables**.

> **Phase 9 update:** Automated payment integrations (PayPal, ATH Móvil, Zelle) have been disabled. The site now operates on a manual sales model — customers contact the seller directly, and the admin registers them and generates access links. Payment-related variables are no longer required.

## Required: Supabase

These three variables are required for the site to function. Without them, all API endpoints return 503.

| Variable | Visibility | Description |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (frontend + backend) | Your Supabase project URL (e.g., `https://abcdefg.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (frontend + backend) | Supabase `anon` public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | Supabase `service_role` secret key — bypasses RLS. Never expose in frontend code. |

**Where to find them:** Supabase dashboard > Project Settings > API.

## Required: Admin Authentication

| Variable | Visibility | Description |
|----------|-----------|-------------|
| `ADMIN_SECRET` | **Server-only** | Secret used for admin JWT signing. Generate with `openssl rand -hex 32`. |

## Optional: Email (Resend)

Required for sending access links and notifications by email.

| Variable | Visibility | Description |
|----------|-----------|-------------|
| `RESEND_API_KEY` | **Server-only** | Resend API key |
| `RESEND_FROM_EMAIL` | **Server-only** | Verified sender email (e.g., `calendario@yourdomain.com`) |
| `RESEND_FROM_NAME` | **Server-only** | Display name (e.g., `14 dias de dulce amor`) |

**Prerequisite:** Add and verify your sending domain in the Resend dashboard before using.

## Optional: General

| Variable | Visibility | Description |
|----------|-----------|-------------|
| `PUBLIC_URL` | Public | Site URL for access links (e.g., `https://lovevalentinday.netlify.app`) |
| `CRON_SECRET` | **Server-only** | Bearer token for the email processing cron endpoint |

## Optional: Calendar Overrides

These default to production values and rarely need to be changed.

| Variable | Visibility | Default | Description |
|----------|-----------|---------|-------------|
| `CALENDAR_YEAR` | **Server-only** | `2027` | Calendar year |
| `CALENDAR_OPEN_HOUR` | **Server-only** | `8` | Hour recipes unlock (24h format) |
| `CALENDAR_TIMEZONE` | **Server-only** | `America/Puerto_Rico` | Business timezone |

## Disabled: Payment Integrations (Legacy)

These variables are no longer required. Payment endpoints return HTTP 410 (Gone). The code is preserved in git history for potential future reactivation.

| Group | Variables |
|-------|-----------|
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT`, `PAYPAL_WEBHOOK_ID` |
| ATH Móvil | `ATH_MOVIL_PUBLIC_TOKEN`, `ATH_MOVIL_PRIVATE_TOKEN`, `ATH_MOVIL_ENVIRONMENT` |

## Netlify Setup Steps

1. Go to https://app.netlify.com and open your site.
2. Navigate to **Site configuration** > **Environment variables**.
3. Add the required Supabase and Admin variables.
4. Optionally add Email (Resend) and General variables.
5. After adding or changing variables, trigger a redeploy: **Deploys** > **Trigger deploy** > **Deploy site**.
6. Wait for the deploy to finish (~1–2 minutes).

## Verification

After deploying, visit:

```
https://lovevalentinday.netlify.app/.netlify/functions/calendar-status
```

- If you see JSON with `serverTime`, `prTime`, `calendarStart`, etc.: Supabase is connected.
- If you see `"El servicio no esta configurado"`: the Supabase variables are missing or the deploy hasn't finished.

## Centralized Validation

The module `Code/site/netlify/functions/lib/env-validation.ts` provides runtime validation:

- `validateEnv()` — returns all groups, their status, and warnings
- `paypalConfigured()` — returns true only when PayPal client ID and secret are set
- `athMovilConfigured()` — returns true only when both ATH tokens are set
- `resendConfigured()` — returns true only when API key and from-email are set

Placeholder values (starting with `placeholder`, `your-`, `xxx`, `changeme`, or `TODO`) are treated as missing.

## Security Rules

- **Never commit `.env` files** — they are in `.gitignore`
- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** in frontend code or client-side bundles
- **Never log secret values** — the validation module reports presence/absence, not values
- **Keep production credentials separate** from sandbox/testing credentials
