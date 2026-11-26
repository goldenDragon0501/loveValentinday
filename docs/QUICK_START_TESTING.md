# Quick Start: Setup and Testing Guide

This guide walks through configuring the entire backend and testing every feature.

**Website**: https://lovevalentinday.netlify.app/
**Admin panel**: https://lovevalentinday.netlify.app/admin/

---

## 1. Configure Supabase

### 1.1 Create a Project

1. Go to https://supabase.com and sign in (or create a free account).
2. Click **New Project**.
3. Choose your organization, name the project (e.g., `lovevalentinday`), set a database password, and select a region close to Puerto Rico (e.g., `us-east-1`).
4. Click **Create new project** and wait ~2 minutes.

### 1.2 Run Database Migrations

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/001_initial_schema.sql` from this repository.
4. Copy the **entire** file contents, paste into the SQL Editor, and click **Run** (green play button).
5. You should see "Success. No rows returned."
6. Repeat for `supabase/migrations/002_seed_data.sql`.
7. Repeat for `supabase/migrations/003_security_hardening.sql`.

### 1.3 Verify Tables Exist

In the SQL Editor, run:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:

| Table | Purpose |
|---|---|
| `admin_users` | Administrator accounts |
| `app_settings` | Application configuration |
| `audit_logs` | Admin action history |
| `calendar_days` | 14 calendar days |
| `customer_access` | Calendar access tokens |
| `customers` | Customer records |
| `email_logs` | Email send history |
| `email_queue` | Email delivery queue |
| `orders` | Purchase orders |
| `payments` | Payment records |
| `products` | Product catalog |
| `rate_limits` | Rate limiting records |
| `recipe_downloads` | Recipe file attachments |
| `recipe_ingredients` | Recipe ingredient lists |
| `recipe_videos` | Recipe YouTube videos |
| `recipes` | Recipe content |
| `webhook_events` | Webhook deduplication |

Also verify the functions exist:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Expected: `check_rate_limit`, `claim_pending_emails`, `finalize_payment`, `get_setting`, `set_setting`, `update_updated_at`.

### 1.4 Get Your Credentials

1. In the Supabase dashboard, click **Project Settings** (gear icon, bottom left).
2. Click **API** in the left sidebar.
3. Copy these values:

| Name | Where to find it | Example |
|---|---|---|
| **Project URL** | Under "Project URL" | `https://abcdefg.supabase.co` |
| **anon public key** | Under "Project API keys" > `anon` `public` | `eyJhbGc...` |
| **service_role key** | Under "Project API keys" > `service_role` `secret` | `eyJhbGc...` |

> **WARNING**: The `service_role` key bypasses Row Level Security. Never expose it in frontend code.

---

## 2. Create an Administrator Account

### 2.1 Create Auth User

1. In Supabase dashboard, click **Authentication** in the left sidebar.
2. Click **Users** tab, then **Add user** > **Create new user**.
3. Enter your admin email and a strong password.
4. Click **Create user**.
5. The user appears in the list. Copy the **User UID** (click the user row to see it).

### 2.2 Insert Admin Record

In the SQL Editor, run (replace the placeholders):

```sql
INSERT INTO admin_users (auth_user_id, name, role)
VALUES (
  'PASTE-YOUR-USER-UID-HERE',
  'Admin',
  'superadmin'
);
```

### 2.3 Verify

```sql
SELECT au.id, au.name, au.role, au.auth_user_id
FROM admin_users au;
```

You should see your admin record.

---

## 3. Connect Supabase to Netlify

1. Go to https://app.netlify.com and open your site (`lovevalentinday`).
2. Navigate to **Site configuration** > **Environment variables**.
3. Add these variables:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
| `ADMIN_SECRET` | A random string for JWT (generate with `openssl rand -hex 32`) |

4. Click **Deploy** > **Trigger deploy** > **Deploy site** to redeploy with the new variables.
5. Wait for the deploy to finish (~1-2 minutes).

### 3.1 Verify Database Connectivity

After redeploy, visit:

```
https://lovevalentinday.netlify.app/.netlify/functions/calendar-status
```

If you see JSON with `serverTime`, `prTime`, `calendarStart`, etc., the connection works.

If you see `"El servicio no esta configurado"`, the environment variables are not set or the deploy hasn't finished.

---

## 4. Test the Admin Dashboard

1. Open https://lovevalentinday.netlify.app/admin/
2. Enter your admin email and password.
3. Click **Iniciar sesion**.

### 4.1 Resumen Tab

- Should show order statistics (all zeros on a fresh database).
- Shows configuration warnings if price is not set.

### 4.2 Configuracion Tab

1. Click the **Configuracion** tab.
2. Set the **Precio (USD)** to your desired price (e.g., `29.99`).
3. Check **Ventas activadas**.
4. Enable **PayPal** (after configuring PayPal below).
5. Enable **Zelle** if desired.
6. Click **Guardar cambios**.
7. Refresh the page and verify the values persisted.

### 4.3 Recetas Tab

- Shows the 5 seeded recipes.
- Click a recipe to see ingredients, videos, and steps.
- Create a test recipe: fill in title, category, add ingredients.
- Verify it appears in the list.

### 4.4 Calendario Tab

- Shows all 14 days (February 1-14, 2027).
- Day 14 should already have "Super coquito de Nutella" assigned.
- Assign recipes to other days using the dropdown.
- Toggle "Publicado" to publish days.
- Click **Publicar todos** to publish all days with recipes.

### 4.5 Clientes Tab

- Empty on a fresh database.
- After a test purchase, search for the test customer.
- View their orders and calendar access.

### 4.6 Pedidos Tab

- Empty on a fresh database.
- After a test purchase, filter by status.
- For Zelle orders: approve/reject with the action buttons.

---

## 5. Configure PayPal Sandbox

### 5.1 Create Developer Account

1. Go to https://developer.paypal.com/ and log in with your PayPal account.
2. If you don't have one, create a free PayPal account first.

### 5.2 Get Sandbox Credentials

1. In the Developer Dashboard, go to **Apps & Credentials**.
2. Make sure **Sandbox** is selected (toggle at the top).
3. Click **Create App**.
4. Name it (e.g., `LoveValentinDay Test`), select **Merchant** type.
5. Click **Create App**.
6. Copy the **Client ID** and **Secret**.

### 5.3 Get Sandbox Test Accounts

1. Go to **Testing** > **Sandbox Accounts**.
2. You should see a **Business** and a **Personal** account.
3. The Personal account is your test buyer. Click the three dots > **View/Edit Account** to see the test email and password.

### 5.4 Configure Webhook

1. In your Sandbox app, scroll to **Webhooks**.
2. Click **Add Webhook**.
3. Enter URL: `https://lovevalentinday.netlify.app/.netlify/functions/paypal-webhook`
4. Select these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REVERSED`
5. Click **Save**.
6. Copy the **Webhook ID** shown.

### 5.5 Add Environment Variables to Netlify

Add these to your Netlify environment variables:

| Key | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | Sandbox Client ID |
| `PAYPAL_CLIENT_SECRET` | Sandbox Secret |
| `PAYPAL_ENVIRONMENT` | `sandbox` |
| `PAYPAL_WEBHOOK_ID` | Webhook ID from step 5.4 |

Trigger a redeploy.

### 5.6 Enable PayPal

1. Go to Admin > Configuracion.
2. Enable PayPal checkbox.
3. Save.

### 5.7 Test a Purchase

1. Open https://lovevalentinday.netlify.app/comprar/
2. Enter a test customer name and email.
3. Select PayPal as payment method.
4. The PayPal button should appear.
5. Click it and log in with the **Sandbox Personal** account credentials.
6. Approve the payment.
7. Verify:
   - Order appears in Admin > Pedidos with status "paid".
   - Customer appears in Admin > Clientes.
   - Customer access token is created.
   - Confirmation email is queued.

---

## 6. Test Zelle Manual Payment

### 6.1 Configure Zelle

1. In Admin > Configuracion, fill in Zelle recipient details:
   - Recipient name
   - Recipient email or phone
2. Enable Zelle.
3. Save.

### 6.2 Test the Flow

1. Open /comprar/ and select Zelle.
2. Enter test customer details and complete checkout.
3. The order should show Zelle payment instructions.
4. The order enters `awaiting_verification` status.
5. In Admin > Pedidos, find the order.
6. Click **Aprobar** to simulate verifying the payment.
7. The order status changes to "paid".
8. Customer access is created atomically.
9. Confirmation email is queued.

### 6.3 Test Rejection

1. Create another Zelle test order.
2. In Admin > Pedidos, click **Rechazar** with a note.
3. Verify the order status changes to "failed".
4. No customer access is created.

---

## 7. Configure Email (Resend)

### 7.1 Create Resend Account

1. Go to https://resend.com and create an account.
2. Add and verify your sending domain.
3. Create an API key.

### 7.2 Add to Netlify

| Key | Value |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM_EMAIL` | Your verified sender email (e.g., `calendario@yourdomain.com`) |
| `RESEND_FROM_NAME` | `14 dias de dulce amor` |

### 7.3 Process Email Queue

The email queue is processed by calling:

```
POST https://lovevalentinday.netlify.app/.netlify/functions/process-emails
Authorization: Bearer <CRON_SECRET>
```

Set up a cron job (e.g., via cron-job.org or Netlify Scheduled Functions) to call this every 2-5 minutes.

For manual testing, you can call it directly:
```bash
curl -X POST https://lovevalentinday.netlify.app/.netlify/functions/process-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 8. ATH Movil (BLOCKED)

ATH Movil Business requires:
- An active ATH Movil Business merchant account from Evertec.
- A `publicToken` and `privateToken` from the merchant app.
- **No sandbox/testing environment exists** (confirmed by official Evertec documentation).

When credentials are available:
1. Set `ATH_MOVIL_PUBLIC_TOKEN` and `ATH_MOVIL_PRIVATE_TOKEN` in Netlify.
2. Enable ATH Movil in Admin > Configuracion.
3. The checkout page will show the ATH Movil payment option.

---

## 9. Payoneer (NOT RECOMMENDED)

Payoneer Checkout (the only consumer-facing product) is **not suitable** for this project:
- Duplicates PayPal's card-payment functionality.
- Requires US/HK legal entity with merchant risk assessment approval.
- Possible $20K+ sales volume requirement.
- No sandbox confirmed for small merchants.
- Adds no new payment channel for Puerto Rico customers.

Recommendation: retain PayPal + Zelle + ATH Movil.

---

## 10. Troubleshooting

### "El servicio no esta configurado" (503)

The Supabase environment variables are not set in Netlify, or the site hasn't been redeployed after adding them.

### Admin login fails

1. Verify the Supabase auth user exists in Authentication > Users.
2. Verify the `admin_users` record exists with matching `auth_user_id`.
3. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

### PayPal button doesn't appear

1. Verify `PAYPAL_CLIENT_ID` is set in Netlify env vars.
2. Verify PayPal is enabled in Admin > Configuracion.
3. Verify the product price is set and sales are enabled.

### Emails not sending

1. Verify `RESEND_API_KEY` is set.
2. Verify the sender domain is verified in Resend.
3. Call the process-emails endpoint manually to trigger queue processing.
4. Check the `email_queue` table in Supabase for failed entries.

### Orders stuck in "pending"

For PayPal: the customer may have closed the browser before completing. The PayPal webhook should handle this if configured.

For Zelle: an admin must manually approve in the Pedidos tab.

---

## 11. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ADMIN_SECRET` | Yes | JWT secret for admin auth |
| `PAYPAL_CLIENT_ID` | For PayPal | PayPal REST API client ID |
| `PAYPAL_CLIENT_SECRET` | For PayPal | PayPal REST API secret |
| `PAYPAL_ENVIRONMENT` | For PayPal | `sandbox` or `production` |
| `PAYPAL_WEBHOOK_ID` | For PayPal | PayPal webhook ID |
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For email | Verified sender email |
| `RESEND_FROM_NAME` | For email | Sender display name |
| `CRON_SECRET` | Optional | Auth for email queue cron |
| `ATH_MOVIL_PUBLIC_TOKEN` | For ATH | ATH Movil public token |
| `ATH_MOVIL_PRIVATE_TOKEN` | For ATH | ATH Movil private token |
| `PUBLIC_URL` | Optional | Site URL for email links |
