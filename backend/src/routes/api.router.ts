import { Router } from "express";
import express from "express";
import { nextToExpress } from "../services/adapter";

// Security & Middleware imports
import { requireAuth } from "../middleware/auth";
import { requireIdempotency } from "../middleware/idempotency";
import { authRateLimiter, uploadRateLimiter, paymentRateLimiter } from "../middleware/rate-limiters";

// 1. Shared / Auth Handlers
import * as sendOtpHandler from "../shared/backend/send-otp-handler";
import * as verifyOtpHandler from "../shared/backend/verify-otp-handler";
import * as authHandlers from "../shared/backend/auth-handlers";

// 2. Client / User Handlers
import * as bookingListHandlers from "../client/backend/booking-list-handlers";
import * as bookingDetailHandlers from "../client/backend/booking-detail-handlers";
import * as trackingHandlers from "../client/backend/tracking-handlers";
import * as userHandlers from "../client/backend/user-handlers";

// 3. Partner Handlers
import * as bookingAvailableHandlers from "../partner/backend/booking-available-handlers";
import * as partnerListHandlers from "../partner/backend/partner-list-handlers";
import * as partnerDetailHandlers from "../partner/backend/partner-detail-handlers";
import * as partnerWalletHandlers from "../partner/backend/partner-wallet-handlers";
import * as partnerBankHandlers from "../partner/backend/partner-bank-handlers";
import * as partnerLocationHandlers from "../partner/backend/partner-location-handlers";
import * as bookingDeclineHandlers from "../partner/backend/booking-decline-handlers";
import * as bookingDispatchHandlers from "../partner/backend/booking-dispatch-handlers";
import * as bookingAcceptHandlers from "../partner/backend/booking-accept-handlers";

// 4. API custom routes
import * as syncCompleteRoute from "../api/bookings/[id]/sync-complete/route";
import * as editorBookingsRoute from "../api/editor/bookings/route";
import * as editorBookingDetailRoute from "../api/editor/bookings/[id]/route";
import * as editorDeliverRoute from "../api/editor/deliver/route";
import * as uploadPresignedUrlRoute from "../api/upload/presigned-url/route";
import * as uploadMockS3Route from "../api/upload/mock-s3/route";
import * as adminDirectoryRoute from "../api/admin/onboarded-directory/route";
import * as adminVerifyPartnerRoute from "../api/admin/verify-partner/route";
import * as adminSeedRoute from "../api/admin/seed/route";
import * as adminAuditLogsRoute from "../api/admin/audit-logs/route";
import * as packagesRoute from "../api/packages/route";
import * as rootRoute from "../api/route";

const router = Router();

// Body parser middlewares
const jsonParser = express.json({ limit: "50mb" });
const rawParser = express.raw({ type: "*/*", limit: "100mb" });

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get("/", jsonParser, nextToExpress(rootRoute.GET));
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy", service: "Orbit API", timestamp: new Date().toISOString() });
});

// Packages list (Public read)
router.get("/packages", jsonParser, nextToExpress(packagesRoute.GET));

// ── Auth Routes (Rate limited) ────────────────────────────────────────────────
router.post("/auth/send-otp", authRateLimiter, jsonParser, nextToExpress(sendOtpHandler.POST));
router.post("/auth/verify-otp", authRateLimiter, jsonParser, nextToExpress(verifyOtpHandler.POST));
router.post("/auth/login", authRateLimiter, jsonParser, nextToExpress(authHandlers.loginHandler));
router.post("/auth/register", jsonParser, nextToExpress(authHandlers.registerHandler));
router.post("/auth/forgot-password", authRateLimiter, jsonParser, nextToExpress(authHandlers.forgotPasswordHandler));
router.post("/auth/reset-password", authRateLimiter, jsonParser, nextToExpress(authHandlers.resetPasswordHandler));
router.post("/auth/google", jsonParser, nextToExpress(authHandlers.googleAuthHandler));
router.post("/auth/apple", jsonParser, nextToExpress(authHandlers.appleAuthHandler));
router.post("/auth/refresh", jsonParser, nextToExpress(authHandlers.refreshTokenHandler));
router.post("/auth/logout", requireAuth(), jsonParser, nextToExpress(authHandlers.logoutHandler));
router.get("/auth/me", requireAuth(), jsonParser, nextToExpress(authHandlers.meHandler));

// ── User Management ───────────────────────────────────────────────────────────
router.get("/users", requireAuth(["ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(userHandlers.GET));
router.post("/users", requireAuth(["ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(userHandlers.POST));

// ── Bookings (Authenticated Users) ───────────────────────────────────────────
router.get("/bookings", requireAuth(), jsonParser, nextToExpress(bookingListHandlers.GET));
router.post("/bookings", requireAuth(), jsonParser, nextToExpress(bookingListHandlers.POST));
router.get("/bookings/available", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(bookingAvailableHandlers.GET));
router.get("/bookings/:id", requireAuth(), jsonParser, nextToExpress(bookingDetailHandlers.GET));
router.patch("/bookings/:id", requireAuth(), jsonParser, nextToExpress(bookingDetailHandlers.PATCH));
router.get("/bookings/:id/track", requireAuth(), jsonParser, nextToExpress(trackingHandlers.GET));

// ── Booking Dispatch & Actions ───────────────────────────────────────────────
router.post("/bookings/:id/dispatch", requireAuth(["CLIENT", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(bookingDispatchHandlers.POST));
router.post("/bookings/:id/accept", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(bookingAcceptHandlers.POST));
router.post("/bookings/:id/decline", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(bookingDeclineHandlers.POST));
router.post("/bookings/:id/sync-complete", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(syncCompleteRoute.POST));

// ── Partners & Wallet ────────────────────────────────────────────────────────
router.post("/partner/location", requireAuth(["PARTNER"]), jsonParser, nextToExpress(partnerLocationHandlers.POST));
router.get("/partners", requireAuth(), jsonParser, nextToExpress(partnerListHandlers.GET));
router.post("/partners", requireAuth(["ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(partnerListHandlers.POST));
// NOTE: /partners/me/* routes MUST be registered before /partners/:id to avoid
// Express treating the literal string "me" as a dynamic :id param.
router.patch("/partners/me/location", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(partnerLocationHandlers.PATCH));
router.get("/partners/:id", requireAuth(), jsonParser, nextToExpress(partnerDetailHandlers.GET));
router.patch("/partners/:id", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(partnerDetailHandlers.PATCH));

// Wallet & Idempotent Withdrawal
router.get("/partners/:id/wallet", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(partnerWalletHandlers.GET));
router.post("/partners/:id/withdraw", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), requireIdempotency, paymentRateLimiter, jsonParser, nextToExpress(partnerWalletHandlers.POST));
router.post("/partners/link-bank", requireAuth(["PARTNER", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(partnerBankHandlers.POST));

// ── Editor Routes ────────────────────────────────────────────────────────────
router.get("/editor/bookings", requireAuth(["EDITOR", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(editorBookingsRoute.GET));
router.get("/editor/bookings/:id", requireAuth(["EDITOR", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(editorBookingDetailRoute.GET));
router.post("/editor/bookings/:id", requireAuth(["EDITOR", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(editorBookingDetailRoute.POST));
router.post("/editor/deliver", requireAuth(["EDITOR", "ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(editorDeliverRoute.POST));
router.post("/upload-reel", requireAuth(["EDITOR", "ADMIN", "SUPER_ADMIN"]), uploadRateLimiter, jsonParser, nextToExpress(editorDeliverRoute.POST));

// ── Upload & Media ───────────────────────────────────────────────────────────
router.post("/upload/presigned-url", requireAuth(), uploadRateLimiter, jsonParser, nextToExpress(uploadPresignedUrlRoute.POST));
router.put("/upload/mock-s3", rawParser, nextToExpress(uploadMockS3Route.PUT));

// ── Admin Routes (SUPER_ADMIN / ADMIN) ───────────────────────────────────────
router.get("/admin/onboarded-directory", requireAuth(["ADMIN", "SUPER_ADMIN"]), jsonParser, nextToExpress(adminDirectoryRoute.GET));
router.post("/admin/verify-partner", requireAuth("SUPER_ADMIN"), jsonParser, nextToExpress(adminVerifyPartnerRoute.POST));
router.post("/admin/seed", requireAuth("SUPER_ADMIN"), jsonParser, nextToExpress(adminSeedRoute.POST));
router.get("/admin/audit-logs", requireAuth("SUPER_ADMIN"), jsonParser, nextToExpress(adminAuditLogsRoute.GET));

export default router;
