# Single-backend architecture (July 2026)

## The problem

This repo used to run TWO separate implementations of the same business
logic (bookings, partners, editor workflow, packages, users, admin, uploads):

1. `backend` — a standalone Express server (port 5000).
   This is what the **mobile apps** and **editor-web-app** actually talk to.
2. `dashboard-web-app` — a Next.js app (port 3000) that
   ALSO had its own copy of every one of those handlers under
   `src/app/api/**`, `src/client/backend/*`, and `src/partner/backend/*`.

Both copies read/write the same underlying Firestore project, so data was
never actually inconsistent — but the *logic* could and did drift. That's
exactly how the editor-accept bug happened: `dashboard-web-app`'s copy of
"editor accepts a booking" was implemented correctly, but the copy in
`backend` (the one the real editor app and mobile apps hit) was missing
entirely, and its booking list silently auto-assigned projects instead of
waiting for an explicit accept.

## The fix

`backend` is now the single source of truth for all of
that logic. `dashboard-web-app`'s API routes under `src/app/api/**`
(bookings, partners, editor, packages, users, admin, upload) are now thin
proxies — see `src/lib/backend-proxy.ts` — that forward the request to
`backend` on port 5000 and mirror its response back. They contain no
business logic of their own anymore, so there's nothing left to drift.

`src/client/backend/*` and `src/partner/backend/*` (the old duplicate
handler implementations in dashboard-web-app) were removed.

`src/shared/backend/auth-handlers.ts` and the `auth/*` routes were left
untouched on purpose: those manage the website's NextAuth session/cookie
login flow, which is a different concern from the marketplace business
logic above and isn't duplicated in `backend`.

## Running locally

`dashboard-web-app` now requires `orbit-marketplace/backend` to be running
(default `http://localhost:5000`) for any booking/partner/editor/admin
feature to work. Override the target with the `BACKEND_API_URL` env var
if you're not running it on the default port.

## If you add a new booking/partner/editor/admin feature

Implement it once, in `orbit-marketplace/backend/src/**`, register the
route in `orbit-marketplace/backend/src/routes/api.router.ts`, and add a
matching thin proxy file under `dashboard-web-app/src/app/api/**` using
`proxyToBackend`. Do not reimplement the logic a second time in
dashboard-web-app.
