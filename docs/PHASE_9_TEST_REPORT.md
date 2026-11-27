# Phase 9 — Test Report

**Date:** 2026-11-27

## Test Results Summary

| Check | Result |
|-------|--------|
| ESLint | 0 errors, 15 warnings (pre-existing `_context` unused params) |
| Vitest | **76/76 tests pass** |
| Next.js build | 7 static pages generated |

## Test Files

| File | Tests | Status |
|------|-------|--------|
| `tests/phase9-manual-sales.test.ts` | 24 | PASS |
| `tests/phase8-recipe-order.test.ts` | 19 | PASS |
| `tests/calendar.test.ts` | 13 | PASS |
| `tests/validation.test.ts` | 11 | PASS |
| `tests/env-validation.test.ts` | 7 | PASS |
| `tests/rate-limit.test.ts` | 2 | PASS |

## Phase 9 Test Coverage (24 tests)

### Contact-based purchase model (4 tests)
1. Site has contact configuration object
2. WhatsApp prefilled message is non-empty Spanish text
3. checkoutUrl still points to /comprar/ for contact page
4. buyerAreaUrl points to /calendario/

### Manual access grant model (3 tests)
5. Access tokens are valid UUIDs
6. Access URL format is correct
7. Grant types include manual and payment

### Disabled payment methods (2 tests)
8. Payment endpoints return 410 response message
9. Legacy payment methods are documented

### Admin customer management actions (7 tests)
10. register_customer action is defined
11. generate_access_link action is defined
12. revoke_access action is preserved
13. activate_access action is preserved
14. All five customer actions exist
15. Email validation pattern rejects invalid emails
16. Name validation requires minimum 2 characters

### Recipe order unchanged from Phase 8 (4 tests)
17. Schedule still has 14 days
18. Recipes still has 14 recipes
19. Day 14 is still the coquito closing
20. Day 14 closing plan is still present

### Environment variable simplification (2 tests)
21. Core required variables are Supabase only
22. Payment variables are no longer required

### Database migration 006 (2 tests)
23. Migration makes order_id nullable for manual grants
24. grant_type distinguishes manual from payment access

## Phase 8 Recipe Order (19 tests — regression)
- Schedule has exactly 14 days
- Schedule matches client's exact recipe sequence (all 14 days verified)
- Every schedule entry has a non-null title
- Every schedule entry has a recipeSlug
- Schedule slugs are all unique
- Day 14 is the special coquito closing
- Days 1–13 are kind "recipe"
- Every schedule slug has a matching recipe
- Recipes array has exactly 14 recipes
- All recipe slugs are unique
- Every recipe has a title and slug
- Coquito (Day 14) has the correct YouTube video ID
- Existing recipes retain their content
- Day 12 title includes "1 y 2"
- New skeleton recipes have empty groups and videos
- Day 14 closing plan has title and intro
- Day 14 closing plan has at least 3 steps
- Preview references an existing recipe slug
- Preview references the Day 1 recipe

## Environment Validation (7 tests — regression)
- Reports Supabase as missing when env vars are absent
- Reports ready when Supabase vars are set
- Flags partial PayPal configuration
- paypalConfigured returns false without credentials
- resendConfigured returns false without API key
- Rejects placeholder values as not present
- Rejects values starting with "xxx" as placeholders

## Calendar Logic (13 tests — regression)
- Unlock times, timezone (UTC-4), day sequencing, boundary conditions

## Payment/Validation (11 tests — regression)
- Integer cents, payment status transitions, access tokens, input validation, YouTube ID extraction

## Rate Limiting (2 tests — regression)
- Header formatting

## Tests NOT Executed (require external services)

| Test Area | Reason |
|-----------|--------|
| Admin manual registration end-to-end | Requires Supabase database connection |
| Access link generation end-to-end | Requires Supabase database connection |
| Email delivery (Resend) | Requires RESEND_API_KEY |
| Admin authentication | Requires Supabase Auth user |

## Build Output

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ○ /calendario
└ ○ /comprar

○  (Static)  prerendered as static content
```
