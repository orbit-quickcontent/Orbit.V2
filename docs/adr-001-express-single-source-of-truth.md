# ADR 001: Standalone Express Backend as Single Source of Truth

* **Status:** Accepted
* **Date:** 2026-08-07
* **Deciders:** Orbit Engineering Team

---

## Context and Problem Statement

Previously, business logic and data access patterns were duplicated across multiple components:
- Next.js serverless API routes (`dashboard-web-app/src/app/api/**`)
- Supabase Edge Functions and SQL RLS policies
- Direct client-side calls to Supabase Storage / Postgres
- Standalone Express backend services (`backend/`)

This multi-backend structure caused state synchronization issues, duplicate business logic drift, missing authentication checks on money routes, and hardcoded localhost dependency failures when deployed to serverless environments such as Vercel.

---

## Decision Drivers

1. **Centralized Security:** All authentication, RBAC, rate limiting, and money movement must be enforced at a single gateway.
2. **Deterministic Data Flow:** Firestore & Socket.IO must be driven by a unified backend service.
3. **Environment Portability:** Frontend applications (Next.js web, mobile PWAs, Capacitor shells) must behave strictly as client applications calling an API gateway driven by `NEXT_PUBLIC_API_URL`.
4. **Idempotency & Auditability:** Financial operations (withdrawals, payouts) require atomic transactions, idempotency headers, and structured audit logs.

---

## Decision

We consolidate the platform architecture to use the **Standalone Express Backend (`backend/`) as the single source of truth**.

### Key Architectural Rules:
1. **No Next.js API Routes:** All routes in `dashboard-web-app/src/app/api/**` are removed. Frontends call the Express API.
2. **No Direct Database Mutations from Clients:** Frontend web and mobile apps authenticate via JWT Bearer tokens and communicate strictly with the Express REST API and Socket.IO servers.
3. **In-Process Realtime Notifications:** Inter-module HTTP calls to `localhost:3003` are replaced by direct in-process `wsNotify` invocations.
4. **Strict Middleware Security:** All Express endpoints (except public `/health`, `/packages`, and `/auth/*`) enforce `requireAuth` JWT validation and RBAC role checks. Money routes enforce `requireIdempotency`.

---

## Consequences

* **Positive:**
  - Single codebase for all API logic, data validation (Zod), and role checks.
  - Zero serverless cold-start latency issues for background dispatch and transcoding tasks.
  - Production deployments require zero hardcoded `localhost` references.
  - Fail-fast environment validation prevents insecure boots.

* **Negative:**
  - Frontends require configuration of `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.
