# Changelog

## Phase 9 — Manual Sales System (2026-11-27)

### Added
- **Contact-based purchase page** (`/comprar/`): WhatsApp, email, and Instagram contact buttons replace the payment checkout form. All channels configurable via `site.contact` in `site.ts`
- **Manual customer registration**: Admin can register customers by name and email, automatically generating a unique access link
- **Access link management**: Admin can generate new links (revoking old ones), copy to clipboard, and share via WhatsApp/email
- **24 new Phase 9 tests** (`tests/phase9-manual-sales.test.ts`): Contact model, manual access grants, disabled payments, admin customer actions, recipe order regression, env simplification, migration 006
- **Admin user guide in Spanish** (`docs/ADMIN_USER_GUIDE_ES.md`): Step-by-step guide for the manual sales workflow
- **Database migration 006** (`006_manual_sales.sql`): Makes `order_id` nullable, adds `grant_type`, `granted_by`, `grant_notes` columns

### Changed
- **Admin ClientesTab**: Complete overhaul with register form, access link display, copy button, generate/revoke controls
- **Admin ConfigTab**: Removed payment method toggles and Zelle config; replaced with "Ventas manuales activas" info card
- **Admin tab order**: Resumen → Clientes → Recetas → Calendario → Configuración → Pedidos
- **Calendar page**: "Cómpralo aquí" → "Consíguelo aquí" in recovery form link
- **Environment variables**: Payment provider credentials no longer required; `.env.example` simplified

### Removed
- **Frontend payment functions**: `checkout()`, `createPayPalOrder()`, `capturePayPalOrder()` removed from `api.ts`
- **Payment checkout UI**: Entire payment form replaced with contact page

### Disabled (410 Gone, code preserved in git history)
- `checkout` endpoint
- `paypal-create` endpoint
- `paypal-capture` endpoint
- `paypal-webhook` endpoint

### Test Results
- 76 tests passing across 6 test files
- 0 lint errors (15 pre-existing warnings)
- Build succeeds: 7 static pages generated

---

## Phase 8 — Calendar Finalization and Functional Integration (2026-11-26)

### Added
- **Client recipe order**: All 14 calendar days assigned to recipes matching the client's ORDEN DE LAS RECETAS.docx sequence exactly
- **9 new skeleton recipes** in both `site.ts` and database migration (`005_client_recipe_order.sql`): Galletas de fresa y gotitas de chocolate, Galletas de doble chocolate, Limonada de fresa, Galletas de polvo de fresas, Bizcocho de chocolate con harina Swans Down, Las mejores galletas de chocolate chips, Frosting de chocolate, Dip cremoso de chocolate 1 y 2, Galletas de Oreo y chocolate chips
- **Day 14 closing experience**: Calendar page shows Valentine's plan alongside the Super coquito de Nutella recipe and YouTube video (KvAklBTkOPc)
- **Centralized environment validation** (`netlify/functions/lib/env-validation.ts`): Checks all env var groups (Supabase, PayPal, ATH Móvil, Resend, General) with ready/warning status
- **19 new Phase 8 tests** (`tests/phase8-recipe-order.test.ts`): Schedule integrity, exact client order verification, recipe matching, slug uniqueness, Day 14 configuration, Day 12 dual-part title, skeleton recipe validation
- **5 new env validation tests** (`tests/env-validation.test.ts`): Supabase readiness, partial PayPal config detection, credential helper functions
- **Missing material report** (`docs/MISSING_MATERIAL_REPORT.md`): Documents 9 skeleton recipes and 1 partial recipe pending client content
- **Deployment guide** (`docs/PHASE_8_DEPLOYMENT_GUIDE.md`): Steps for production deploy once Netlify credits are restored
- **Rollback plan** (`docs/PHASE_8_ROLLBACK_PLAN.md`): Frontend revert and database rollback SQL
- **Client requirements status** (`docs/PHASE_8_CLIENT_REQUIREMENTS.md`): Implemented, pending, and blocked items

### Changed
- **Schedule array** (`site.ts`): 14 entries with correct titles, slugs, and day kinds matching client's document
- **Recipes array** (`site.ts`): Reordered to match calendar day sequence; all 14 recipes with correct titles
- **Categories** (`site.ts`): Updated to reflect the full 14-recipe lineup
- **Recipes component** (`Recipes.tsx`): Filters to only show recipes with video and ingredient content on the homepage

### Database
- **Migration 005**: Inserts 9 new recipes, assigns all 14 to calendar days. Wrapped in transaction, safe to run repeatedly.

### Test Results
- 50 tests passing (19 Phase 8 recipe + 5 env validation + 26 existing)
- 0 lint errors (15 pre-existing warnings from Netlify function convention)
- Build succeeds: 7 static pages generated

---

## Phase 7 — Security Hardening (commit 58207db)

### Added
- Security audit and hardening across all Netlify Functions
- `004_security_search_path.sql`: SET search_path on all SECURITY DEFINER functions
- Zero-amount payment rejection in finalize_payment
- Rate limiting infrastructure
- Email queue with retry logic
- Production checklist and security audit documentation

---

## Phase 6 — Admin Dashboard and Payment Integration

### Added
- Full admin dashboard with 6 tabs (Resumen, Pedidos, Recetas, Calendario, Clientes, Configuración)
- PayPal server-to-server checkout (create/capture/webhook)
- Zelle manual verification flow
- ATH Móvil placeholder (blocked: no sandbox)
- Email notifications via Resend
- Calendar access control with token-based authentication

---

## Phase 5 — Database Schema and Backend

### Added
- Supabase PostgreSQL schema (001_initial_schema.sql)
- Seed data with 5 verified recipes (002_seed_data.sql)
- Security hardening migration (003_security_hardening.sql)
- 21 Netlify Functions for complete API surface
- Atomic payment finalization via PostgreSQL function

---

## Phases 1–4 — Foundation

### Added
- Next.js 16 static site with Tailwind CSS 4
- Valentine's calendar UI with 14-day heart grid
- Route component (satin ribbon timeline)
- Recipe cards with YouTube embeds
- Gift card creator
- Community section
- Responsive design with animations
- Puerto Rico timezone support (UTC-4)
