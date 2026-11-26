# Netlify Deployment

## Prerequisites

- Node.js 18+
- Netlify account with site created
- Supabase project configured (see SUPABASE_SETUP.md)
- PayPal developer credentials (see PAYMENT_SETUP.md)

## Project Structure

```
lovevalentinday/
  netlify.toml          # Netlify configuration
  Code/site/            # Next.js application
    netlify/functions/  # Serverless functions (TypeScript, esbuild)
    out/                # Static export output
```

## netlify.toml

```toml
[build]
  base = "Code/site"
  command = "npm run build"
  publish = "out"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

## Environment Variables

Set all variables from `.env.example` in Netlify:
**Site > Environment variables**

Required for basic operation:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SECRET`

Required for payments:
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT`, `PAYPAL_WEBHOOK_ID`

Required for email:
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`

Optional:
- `CRON_SECRET` (for scheduled email queue processing)
- `ATH_MOVIL_PUBLIC_TOKEN`, `ATH_MOVIL_PRIVATE_TOKEN` (when available)
- `PUBLIC_URL` (for email links)

## Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Link to site
netlify link

# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

Or connect your Git repository for automatic deploys.

## Serverless Functions

All functions are in `Code/site/netlify/functions/` and use:
- Proxy-based lazy Supabase initialization (graceful 503 when unconfigured)
- Distributed rate limiting via Supabase
- CORS headers for cross-origin requests
- JSON error responses in Spanish

### Endpoints

| Function | Method | Purpose |
|---|---|---|
| `checkout` | POST | Create order + pending payment |
| `paypal-create` | POST | Create PayPal order |
| `paypal-capture` | POST | Capture PayPal payment |
| `paypal-webhook` | POST | PayPal webhook receiver |
| `calendar-status` | GET | Calendar unlock status |
| `day-content` | GET | Day content for authorized users |
| `verify-access` | POST | Verify customer access token |
| `recover-access` | POST | Email access recovery |
| `admin-dashboard` | GET | Admin stats overview |
| `admin-orders` | GET/POST | Order management |
| `admin-recipes` | GET/POST | Recipe CRUD |
| `admin-calendar` | GET/POST | Calendar day management |
| `admin-customers` | GET/POST | Customer management |
| `admin-settings` | GET/POST | App configuration |
| `process-emails` | POST | Email queue processor |

## Email Queue Processing

For reliable email delivery, set up a scheduled function or external cron to call:

```
POST https://your-site.netlify.app/.netlify/functions/process-emails
Authorization: Bearer <CRON_SECRET>
```

Recommended interval: every 2-5 minutes.

## Production Checklist

1. All environment variables set
2. Supabase migrations applied (001, 002, 003)
3. Admin user created
4. Product price configured via admin dashboard
5. PayPal webhook URL configured and verified
6. Resend domain verified
7. `PAYPAL_ENVIRONMENT=production` for live payments
8. Test a complete purchase flow end-to-end
