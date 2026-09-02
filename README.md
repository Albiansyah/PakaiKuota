# PakaiKuota.id – Application Structure

## Project Status

- **Next.js + TypeScript + Tailwind** – Frontend
- **Supabase** – Auth & Database (local DB, not cloud)
- **Zustand** – State management
- **Redis** – Rate limiting & quota cache (simulated)

## Key Features Implemented

### Auth & Users
- ✅ Email + Google OAuth sign‑up/login via Supabase
- ✅ Protected routes (dashboard, API keys, top‑up, etc.)
- ✅ Role‑based access (user / super_admin / support)
- ✅ Email verification required for API key generation

### Core User Pages
- **Dashboard** (`/dashboard`) – navigation hub
- **API Keys** (`/dashboard/api-keys`) – create/view/update/delete keys
- **Top‑up** (`/dashboard/topup`) – simulate QRIS payment
- **Settings** (`/dashboard/settings`) – profile, privacy, password
- **Playground** (`/playground`) – trial quota playground
- **Docs** (`/docs`) – quickstart & reference
- **Admin** (`/admin`) – user/model/transaction mgmt (admin only)

### UI Components
- Button (primary/secondary/ghost/danger)
- Input (styled)
- Google login button

### Supabase Schema
- users, api_keys, transactions, usage_logs, models
- Enums, constraints, audit fields

## Running

```bash
npm run dev  # on http://localhost:3000
```

## Setup Checklist (next steps)

- [ ] Create Supabase tables locally (or use migration SQL)
- [ ] Add payment gateway integration (Pakasir QRIS/VA)
- [ ] Build New API gateway (Go, Docker)
- [ ] Implement Redis atomic quota deduction + rate limiting
- [ ] Add webhook handlers for payment status / reconciliation
- [ ] Add model catalog sync from OpenRouter
- [ ] Implement admin RBAC, audit logs, refunds
- [ ] Polish UI/UX per design system

## Technologies

- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS v4
- Supabase (Auth + PostgreSQL)
- Zustand
- ESLint + Prettier

## Code Quality

- Clean architecture (lib/, components/, hooks/, store/, types/)
- Type‑first with `@supabase/ssr` (edge runtime compatible)
- Component composition with radix‑ui style utilities
- No third‑party UI lib beyond Tailwind
- All imports from `@/` alias
- Unit‑test ready structure

## What’s Missing (MVP items)

1. **Payment processing** – connect to Pakasir QRIS/VA
2. **API Gateway** – New API service with quota management
3. **Quota system** – atomic Redis deduction, hard limits
4. **Webhooks** – payment status, reconciliation jobs
5. **Model catalog** – sync from OpenRouter with markup
6. **Playground quota** – separate trial quota
7. **Admin RBAC** – full control over users, models, refunds
8. **Business logic** – signup limits, email verification, etc.

## Planned MVP Release

Focus on:
- Sign‑up/login + Google OAuth
- Dashboard + API key CRUD
- Top‑up (simulated QRIS)
- Basic usage tracking
- Admin tools for super_admin
- Error handling & logging

## Files Created

All app/ pages, components/, lib/, types/, and basic routes.

## Linting

```bash
npm run lint  # eslint
```

## Next Steps for Developer

1. Create Supabase tables using the `src/types/supabase.ts` schema
2. Add API routes (`src/app/api/`) for auth callbacks, webhooks, payments
3. Implement state (store/) for auth, ui, etc.
4. Build Redis client + Lua scripts for quota deduction
5. Add payment integration (Pakasir SDK)
6. Develop New API gateway service (separate repo)
7. Write tests for core flows
8. Polish UI/UX with proper styling

## Notes

- Real payment processing requires integration with Pakasir (live sandbox)
- Redis is used for rate‑limiting and atomic quota deduction
- All secret keys (OpenRouter, DB passwords) should be in secret manager
- Staging environment required for payment testing
- PPN status depends on PT Ales Cipta Sejahtera’s PKP registration

## CLI Commands to Remember

```bash
# Start dev server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Start production
npm run start
```