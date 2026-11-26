# Security Audit Report

**Date**: 2026-11-26
**Scope**: Phase 6 — Security Hardening, Administration Completion and Production Readiness

## Summary

All critical security vulnerabilities identified in the Phase 5 audit have been addressed. Payment processing is now atomic, rate limiting is distributed, and admin endpoints are protected.

## Findings and Mitigations

### 1. Netlify Function Initialization Crashes — FIXED

**Issue**: Supabase client called `createClient("")` at module load time, crashing all functions when env vars were missing.

**Fix**: Proxy-based lazy initialization in `lib/supabase.ts`. Clients are created on first access. `requireSupabase()` guard returns 503 JSON when unconfigured.

### 2. Non-Atomic Payment Processing — FIXED

**Issue**: Payment capture, order update, access creation, and email sending were separate operations that could fail mid-way, leaving inconsistent state.

**Fix**: `finalize_payment()` PostgreSQL function (SECURITY DEFINER) handles all state transitions atomically within a single transaction:
- Locks payment row with `FOR UPDATE`
- Verifies amount matches expected price
- Checks for idempotency (already-completed payments return existing token)
- Updates payment status, order status
- Creates customer access with hashed token
- Returns token for email delivery

### 3. Zero-Price Purchase Prevention — FIXED

**Issue**: No server-side validation prevented $0.00 orders.

**Fix**: Multiple layers:
- `checkout.ts` validates `product.price_cents > 0`
- `checkout.ts` checks `sales_enabled` setting
- `finalize_payment()` verifies `p_amount_cents > 0` and matches product price
- Price stored as integer cents (no floating-point)

### 4. Rate Limiting — IMPLEMENTED

**Issue**: No rate limiting on any endpoint.

**Fix**: Supabase-backed distributed rate limiting via `check_rate_limit()` RPC:
- Per-endpoint configurations (checkout: 5/60s, recover-access: 3/300s, admin: 30/60s)
- Uses `x-nf-client-connection-ip` (Netlify trusted header)
- Probabilistic expired-record cleanup (1% chance per check)
- Graceful fallback: allows requests if Supabase is unavailable

### 5. PayPal Webhook Verification — IMPLEMENTED

**Issue**: No webhook endpoint; payment confirmation relied solely on client-side capture.

**Fix**: `paypal-webhook.ts` with:
- Signature verification via PayPal API (`/v1/notifications/verify-webhook-signature`)
- Event deduplication via `webhook_events` table (unique constraint on provider+event_id)
- Handles COMPLETED, DENIED, REVERSED events
- Reversals revoke customer access

### 6. Zelle Hardening — FIXED

**Issue**: Zelle approval was non-atomic and had no audit trail.

**Fix**: Admin approval now calls `finalize_payment()` atomically. All admin actions logged to `audit_logs`.

### 7. Customer Access Token Security — IMPROVED

**Issue**: Access tokens stored in plaintext.

**Fix**: `token_hash` column added to `customer_access`. Tokens are hashed before storage. Unique index ensures one active access per order.

### 8. Email Delivery — IMPROVED

**Issue**: Email failures during payment could lose the access notification.

**Fix**: `email_queue` table with:
- Retry logic (up to 3 attempts)
- Idempotency keys prevent duplicate sends
- `claim_pending_emails()` with FOR UPDATE SKIP LOCKED for concurrent safety
- Separate `process-emails` function for scheduled processing

## Remaining Risks

| Risk | Severity | Status |
|---|---|---|
| ATH Movil integration not implemented | Medium | BLOCKED (no sandbox available) |
| No end-to-end automated tests | Medium | Test stubs recommended |
| No WAF / DDoS protection beyond rate limiting | Low | Netlify provides basic protection |
| Email queue requires external cron trigger | Low | Document in deployment guide |
| Admin password in DB requires manual bcrypt | Low | Standard for MVP |

## Architecture

All security-critical functions use `SECURITY DEFINER` and `REVOKE ALL FROM PUBLIC` / `GRANT EXECUTE TO service_role`, ensuring they run with elevated privileges only through the service role key, never from the frontend.
