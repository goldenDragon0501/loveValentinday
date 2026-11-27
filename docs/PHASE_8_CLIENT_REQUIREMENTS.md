# Phase 8 — Client Requirements Status

## Implemented

| Requirement | Status | Notes |
|---|---|---|
| Client's final recipe order (14 days) | COMPLETE | Matches ORDEN DE LAS RECETAS.docx exactly |
| Day 14 closing experience | COMPLETE | Coquito de Nutella + video KvAklBTkOPc + Valentine's plan |
| Database migration 005 | COMPLETE | Ready to run on production Supabase |
| Centralized env validation | COMPLETE | Detects missing/partial configuration |
| Automated test coverage | COMPLETE | 50 tests passing (19 new for recipe order) |
| Missing material report | COMPLETE | Documents all 9 skeleton recipes |
| Admin dashboard recipe management | COMPLETE | Existing functionality supports adding content |
| PayPal integration (sandbox) | COMPLETE | Requires sandbox credentials to test |
| Zelle manual verification | COMPLETE | Admin approve/reject flow |
| Calendar access control | COMPLETE | Token-based, server-side date enforcement |
| Security hardening | COMPLETE | RLS, search_path, rate limiting, atomic payments |

## Pending Client Decisions

| Decision | Impact | Needed By |
|---|---|---|
| **Recipe content for 9 skeleton recipes** | Days 2, 5, 7–13 show only titles without content | Before launch (Feb 1, 2027) |
| **Super coquito de Nutella ingredient list** | Day 14 recipe has video but no ingredients | Before launch |
| **Product price (USD)** | Checkout shows "muy pronto" until set | Before sales open |
| **Production deployment authorization** | Site shows Phase 7 code in production | When ready to go live with Phase 8 |

## Blocked on External Dependencies

| Item | Blocker | Action Required |
|---|---|---|
| **ATH Móvil integration** | No sandbox environment exists; requires merchant account from Evertec | Client must apply for ATH Móvil Business account and provide `publicToken` and `privateToken` |
| **PayPal production mode** | Requires authorized production credentials | Client/business manager must create PayPal Business app and provide production Client ID and Secret |
| **Resend email delivery** | Requires verified sender domain | Client must register a domain with Resend and verify DNS records |
| **Netlify deployment** | Team is out of deployment credits | Credits must be restored or plan upgraded |

## Content the Client Must Provide

For each of these 9 recipes, provide:
- Ingredient list with quantities
- Preparation steps (in order)
- Baking/preparation instructions (temperature, time)
- YouTube video ID(s) for step-by-step video(s)
- Notes or tips (optional)

| Day | Recipe |
|---|---|
| 2 | Galletas de fresa y gotitas de chocolate |
| 5 | Galletas de doble chocolate |
| 7 | Limonada de fresa |
| 8 | Galletas de polvo de fresas |
| 9 | Bizcocho de chocolate con harina Swans Down |
| 10 | Las mejores galletas de chocolate chips |
| 11 | Frosting de chocolate |
| 12 | Dip cremoso de chocolate 1 y 2 |
| 13 | Galletas de Oreo y chocolate chips |

Content can be added through the admin dashboard (Recetas tab) without code changes.
