/**
 * Client Backend - API Handler Modules
 *
 * These are re-exported by the Next.js API routes in src/app/api/
 */
export { GET as getUsers, POST as createUser } from "./user-handlers";
export { GET as getBookings, POST as createBooking } from "./booking-list-handlers";
export { GET as getBooking, PATCH as updateBooking } from "./booking-detail-handlers";
export { GET as getTracking } from "./tracking-handlers";
export { GET as getPackages } from "./package-handlers";
