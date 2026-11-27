# Payment Configuration Guide

## Responsibility Separation

| Responsibility | Who |
|---|---|
| Technical integration (code, API calls, webhooks, error handling) | Developer |
| Creating commercial payment accounts | Client / Business Manager |
| Linking bank accounts, credit cards, debit cards | Client / Business Manager |
| Completing business identity verification | Client / Business Manager |
| Authorizing production payment processing | Client / Business Manager |
| Receiving customer payments | Client / Business Manager |

The developer does not need to attach personal financial accounts to any payment provider.

---

## PayPal

### Status: Implemented — requires Sandbox credentials for testing

### Sandbox Setup

1. Go to https://developer.paypal.com/ and log in.
2. Navigate to **Apps & Credentials**.
3. Toggle to **Sandbox** mode.
4. Click **Create App**, name it (e.g., `LoveValentinDay Test`), select **Merchant** type.
5. Copy the **Client ID** and **Secret**.

### Sandbox Test Accounts

1. Go to **Testing** > **Sandbox Accounts**.
2. Use the **Personal** account as the test buyer.
3. Click three dots > **View/Edit Account** to see test email and password.

### Webhook Configuration

1. In the Sandbox app, scroll to **Webhooks** > **Add Webhook**.
2. URL: `https://lovevalentinday.netlify.app/.netlify/functions/paypal-webhook`
3. Select events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REVERSED`
4. Copy the **Webhook ID**.

### Environment Variables

| Variable | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | Sandbox Client ID |
| `PAYPAL_CLIENT_SECRET` | Sandbox Secret |
| `PAYPAL_ENVIRONMENT` | `sandbox` |
| `PAYPAL_WEBHOOK_ID` | Webhook ID from above |

### Verified Server-Side Behavior

- Order creation with correct amount and currency
- Payment capture via server-to-server API call
- Amount and currency verification against database order
- Webhook signature verification
- Duplicate payment prevention via idempotent `finalize_payment` function
- Payment cancellation does not grant access
- Access token generated only after successful server-side capture

### Production Activation

1. The client creates or provides a **live PayPal Business account**.
2. Create a **Live** app in the PayPal Developer Dashboard.
3. Copy the Live Client ID and Secret.
4. Set up the Live Webhook with the same events.
5. Update Netlify environment variables with live credentials.
6. Change `PAYPAL_ENVIRONMENT` to `production`.
7. Redeploy.

**Do not activate production PayPal without explicit client authorization.**

---

## ATH Movil Business

### Status: BLOCKED — no sandbox, no merchant credentials

ATH Movil Business requires:
- An active merchant account from Evertec
- A `publicToken` and `privateToken` from the merchant app
- **No sandbox/testing environment exists** (confirmed by official Evertec documentation)

### Implementation Status

The integration code is in place:
- Frontend payment modal initialization
- Transaction reference handling
- Server-side verification endpoint

### When Credentials Are Available

1. Set `ATH_MOVIL_PUBLIC_TOKEN` and `ATH_MOVIL_PRIVATE_TOKEN` in Netlify.
2. Enable ATH Movil in Admin > Configuracion.
3. Redeploy.
4. Test with a small real transaction (there is no sandbox alternative).

### Client Action Required

The client or business manager must:
1. Apply for an ATH Movil Business account through Evertec.
2. Complete the merchant onboarding process.
3. Obtain the public and private tokens.
4. Provide the tokens to the developer for configuration.

---

## Zelle

### Status: Implemented — manual verification workflow

Zelle does not offer a merchant API for small businesses. The integration uses a manual verification workflow where administrators approve payments.

### How It Works

1. Customer selects Zelle at checkout.
2. Customer sees payment instructions with the recipient's Zelle information.
3. Customer completes the Zelle transfer outside the website.
4. Customer submits a payment reference or proof.
5. The order enters `awaiting_verification` status.
6. An administrator reviews the payment in Admin > Pedidos.
7. Administrator clicks **Aprobar** (approve) or **Rechazar** (reject).
8. On approval, the atomic `finalize_payment` function:
   - Marks the payment as completed
   - Marks the order as paid
   - Creates the customer access token
   - Queues a confirmation email
9. On rejection, the order is marked as failed with no access granted.

### Configuration

In Admin > Configuracion, set:
- Zelle recipient name
- Zelle recipient email or phone number
- Enable the Zelle payment method

### Security

- Duplicate approvals cannot create multiple access tokens (enforced by `finalize_payment`)
- Payment evidence is not publicly accessible
- Only authenticated administrators can approve or reject payments
- All approval/rejection actions are logged in the audit trail

### No Automated Integration

Do not build an unofficial automated Zelle integration. Zelle's terms of service do not support automated merchant verification for small businesses. The manual workflow is the correct approach.
