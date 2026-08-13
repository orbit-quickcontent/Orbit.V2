# ORBIT Production Hardening Scope

This change aligns the production booking contract around one authoritative state machine and removes runtime ambiguity.

## Authoritative booking states

PENDING -> PAID -> DISPATCHED -> EN_ROUTE -> SHOOTING -> SYNCING -> EDITING -> DELIVERED

Cancellation may terminate an active booking where business rules permit it.

## Acceptance invariant

A partner may transition a booking to EN_ROUTE only when there is a live PENDING WorkDispatch record for that partner. The acceptance operation must claim the dispatch and booking atomically so two partners cannot win the same booking.

## Runtime direction

The backend remains the API and WebSocket entry point. Database migration away from the compatibility layer is intentionally a separate change; this patch does not silently change production persistence.
