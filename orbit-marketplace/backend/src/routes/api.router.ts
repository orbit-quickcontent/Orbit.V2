import { Router } from 'express';
import { nextToExpress } from '../services/adapter';
import express from 'express';

// 1. Shared / Auth Handlers
import * as sendOtpHandler from '../shared/backend/send-otp-handler';
import * as verifyOtpHandler from '../shared/backend/verify-otp-handler';

// 2. Client / User Handlers
import * as bookingListHandlers from '../client/backend/booking-list-handlers';
import * as bookingDetailHandlers from '../client/backend/booking-detail-handlers';
import * as trackingHandlers from '../client/backend/tracking-handlers';
import * as userHandlers from '../client/backend/user-handlers';

// 3. Partner Handlers
import * as bookingAvailableHandlers from '../partner/backend/booking-available-handlers';
import * as partnerListHandlers from '../partner/backend/partner-list-handlers';
import * as partnerDetailHandlers from '../partner/backend/partner-detail-handlers';
import * as partnerWalletHandlers from '../partner/backend/partner-wallet-handlers';
import * as partnerBankHandlers from '../partner/backend/partner-bank-handlers';
import * as bookingAcceptHandlers from '../partner/backend/booking-accept-handlers';
import * as bookingDeclineHandlers from '../partner/backend/booking-decline-handlers';
import * as bookingDispatchHandlers from '../partner/backend/booking-dispatch-handlers';

// 4. API custom routes
import * as syncCompleteRoute from '../api/bookings/[id]/sync-complete/route';
import * as editorBookingsRoute from '../api/editor/bookings/route';
import * as editorBookingDetailRoute from '../api/editor/bookings/[id]/route';
import * as editorDeliverRoute from '../api/editor/deliver/route';
import * as uploadPresignedUrlRoute from '../api/upload/presigned-url/route';
import * as uploadMockS3Route from '../api/upload/mock-s3/route';
import * as adminDirectoryRoute from '../api/admin/onboarded-directory/route';
import * as adminVerifyPartnerRoute from '../api/admin/verify-partner/route';
import * as adminSeedRoute from '../api/admin/seed/route';
import * as adminAuditLogsRoute from '../api/admin/audit-logs/route';
import * as packagesRoute from '../api/packages/route';
import * as rootRoute from '../api/route';

const router = Router();

// Configure body parser middleware specifically for different route patterns
const jsonParser = express.json({ limit: '50mb' });
const rawParser = express.raw({ type: '*/*', limit: '100mb' });

// Root check
router.get('/', jsonParser, nextToExpress(rootRoute.GET));

// Auth routes
router.post('/auth/send-otp', jsonParser, nextToExpress(sendOtpHandler.POST));
router.post('/auth/verify-otp', jsonParser, nextToExpress(verifyOtpHandler.POST));

// User routes
router.get('/users', jsonParser, nextToExpress(userHandlers.GET));
router.post('/users', jsonParser, nextToExpress(userHandlers.POST));

// Packages
router.get('/packages', jsonParser, nextToExpress(packagesRoute.GET));

// Bookings
router.get('/bookings', jsonParser, nextToExpress(bookingListHandlers.GET));
router.post('/bookings', jsonParser, nextToExpress(bookingListHandlers.POST));
router.get('/bookings/available', jsonParser, nextToExpress(bookingAvailableHandlers.GET));
router.get('/bookings/:id', jsonParser, nextToExpress(bookingDetailHandlers.GET));
router.patch('/bookings/:id', jsonParser, nextToExpress(bookingDetailHandlers.PATCH));
router.get('/bookings/:id/track', jsonParser, nextToExpress(trackingHandlers.GET));

// Dispatch / Actions on Bookings
router.post('/bookings/:id/dispatch', jsonParser, nextToExpress(bookingDispatchHandlers.POST));
router.post('/bookings/:id/accept', jsonParser, nextToExpress(bookingAcceptHandlers.POST));
router.post('/bookings/:id/decline', jsonParser, nextToExpress(bookingDeclineHandlers.POST));
router.post('/bookings/:id/sync-complete', jsonParser, nextToExpress(syncCompleteRoute.POST));

// Partners
router.get('/partners', jsonParser, nextToExpress(partnerListHandlers.GET));
router.post('/partners', jsonParser, nextToExpress(partnerListHandlers.POST));
router.get('/partners/:id', jsonParser, nextToExpress(partnerDetailHandlers.GET));
router.patch('/partners/:id', jsonParser, nextToExpress(partnerDetailHandlers.PATCH));
router.get('/partners/:id/wallet', jsonParser, nextToExpress(partnerWalletHandlers.GET));
router.post('/partners/:id/withdraw', jsonParser, nextToExpress(partnerWalletHandlers.POST));
router.post('/partners/link-bank', jsonParser, nextToExpress(partnerBankHandlers.POST));

// Editor routes
router.get('/editor/bookings', jsonParser, nextToExpress(editorBookingsRoute.GET));
router.get('/editor/bookings/:id', jsonParser, nextToExpress(editorBookingDetailRoute.GET));
router.post('/editor/deliver', jsonParser, nextToExpress(editorDeliverRoute.POST));
router.post('/upload-reel', jsonParser, nextToExpress(editorDeliverRoute.POST));

// Upload routes
router.post('/upload/presigned-url', jsonParser, nextToExpress(uploadPresignedUrlRoute.POST));
// S3 Mock PUT expects raw binary stream
router.put('/upload/mock-s3', rawParser, nextToExpress(uploadMockS3Route.PUT));

// Admin routes
router.get('/admin/onboarded-directory', jsonParser, nextToExpress(adminDirectoryRoute.GET));
router.post('/admin/verify-partner', jsonParser, nextToExpress(adminVerifyPartnerRoute.POST));
router.post('/admin/seed', jsonParser, nextToExpress(adminSeedRoute.POST));
router.get('/admin/audit-logs', jsonParser, nextToExpress(adminAuditLogsRoute.GET));

export default router;
