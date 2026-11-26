# Payment Setup

## PayPal

### 1. Create Application

1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Create a REST API application
3. Note Client ID and Client Secret

### 2. Configure Webhook

1. In the PayPal Developer Dashboard, go to your app > Webhooks
2. Add webhook URL: `https://your-site.netlify.app/.netlify/functions/paypal-webhook`
3. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REVERSED`
4. Note the Webhook ID

### 3. Environment Variables

| Variable | Description |
|---|---|
| `PAYPAL_CLIENT_ID` | REST API Client ID |
| `PAYPAL_CLIENT_SECRET` | REST API Client Secret |
| `PAYPAL_ENVIRONMENT` | `sandbox` or `production` |
| `PAYPAL_WEBHOOK_ID` | Webhook ID from step 2 |

### 4. Payment Flow

1. Customer clicks "Pay with PayPal"
2. Frontend calls `checkout` function (creates order + pending payment)
3. Frontend calls `paypal-create` (creates PayPal order via API)
4. Customer approves in PayPal modal
5. Frontend calls `paypal-capture` (captures payment, runs `finalize_payment()`)
6. Customer receives access token + confirmation email

Webhook provides backup verification for edge cases (browser closed, network issues).

---

## ATH Movil

### Status: BLOCKED

ATH Movil Business uses a JavaScript-modal-based flow with **no server-side sandbox environment**. Integration requires:

- Active ATH Movil Business merchant account
- Production credentials from Evertec
- Real device testing (no emulator support confirmed)

### When Ready

1. Set `ATH_MOVIL_PUBLIC_TOKEN` and `ATH_MOVIL_PRIVATE_TOKEN` in Netlify env
2. Enable ATH Movil in admin dashboard (Configuracion > Metodos de pago)
3. The checkout flow will display ATH Movil as an option
4. After payment modal completion, the client-side callback triggers `finalize_payment()`

### References

- [ATH Movil Business Docs (Evertec GitHub)](https://github.com/evertec/athmovil-javascript-api)

---

## Zelle

### Configuration

Zelle uses manual verification. No API integration.

1. In admin dashboard, go to Configuracion tab
2. Fill in Zelle recipient details:
   - Recipient name
   - Recipient email
   - Recipient phone
3. Enable Zelle as a payment method

### Payment Flow

1. Customer selects Zelle at checkout
2. System shows Zelle recipient info and instructions
3. Customer makes Zelle transfer externally
4. Order enters `awaiting_verification` status
5. Admin reviews in Pedidos tab and approves/rejects
6. Approval runs `finalize_payment()` atomically (creates access + sends email)

### Security

- Admin must verify payment independently (bank statement, Zelle notification)
- Never approve based solely on customer-submitted screenshots
- Rejections can include notes explaining why
