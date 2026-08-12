// Partner Backend - API Handler Modules
export { GET as getPartners, POST as createPartner } from "./partner-list-handlers";
export { GET as getPartner, PATCH as updatePartner } from "./partner-detail-handlers";
export { POST as dispatchBooking } from "./booking-dispatch-handlers";
export { POST as acceptBooking } from "./booking-accept-handlers";
export { POST as declineBooking } from "./booking-decline-handlers";
export { GET as getAvailableBookings } from "./booking-available-handlers";
export { GET as getPartnerWallet, POST as withdrawFromWallet } from "./partner-wallet-handlers";
