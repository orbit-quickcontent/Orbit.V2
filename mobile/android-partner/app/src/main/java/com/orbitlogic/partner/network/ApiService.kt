package com.orbitlogic.partner.network

import retrofit2.http.*

// ─── Data Transfer Objects ───────────────────────────────────────────────────

data class SendOtpRequest(val email: String)
data class SendOtpResponse(val success: Boolean, val message: String)

data class VerifyOtpRequest(val email: String, val otp: String)
data class VerifyOtpResponse(
    val token: String,
    val user: UserDto,
    val partnerId: String?
)

data class UserDto(
    val id: String,
    val email: String,
    val name: String?,
    val phone: String?,
    val role: String,
    val avatar: String?
)

data class BookingDto(
    val id: String,
    val status: String,
    val bookingDate: String,
    val timeSlot: String,
    val location: String?,
    val notes: String?,
    val syncPercentage: Int,
    val createdAt: String,
    // Real-time fields from dispatch
    val clientLatitude: Double? = null,
    val clientLongitude: Double? = null,
    val clientName: String? = null,
    val clientPhone: String? = null,
    val packageName: String? = null,
    val packagePrice: Double? = null,
    val distanceKm: Double? = null,
    val etaMinutes: Int? = null
)

// Location update request — sent every 5s while partner is online
data class LocationUpdateRequest(
    val latitude: Double,
    val longitude: Double,
    val speed: Float = 0f,
    val heading: Float = 0f
)
data class LocationUpdateResponse(val success: Boolean, val nearbyBookings: Int = 0)

data class PartnerProfileDto(
    val id: String,
    val userId: String,
    val location: String,
    val availability: Boolean,
    val isVerified: Boolean,
    val rating: Float,
    val completedProjects: Int,
    val deviceInfo: String?,
    val walletBalance: Double,
    val pendingClearance: Double,
    val totalWithdrawn: Double,
    val payoutEnabled: Boolean,
    val verificationStatus: String
)

data class UpdatePartnerRequest(
    val availability: Boolean?,
    val location: String?,
    val deviceInfo: String?
)

data class LinkBankRequest(
    val accountHolderName: String,
    val accountNumber: String,
    val ifscCode: String,
    val bankName: String
)

data class LinkBankResponse(
    val success: Boolean,
    val status: String
)

data class WithdrawalRequest(val amount: Double)
data class WithdrawalResponse(
    val success: Boolean,
    val message: String,
    val transactionId: String?
)

data class PresignedUrlRequest(
    val bookingId: String,
    val fileName: String,
    val contentType: String
)

data class PresignedUrlResponse(
    val uploadUrl: String,
    val key: String
)

data class AcceptBookingRequest(val partnerId: String)
data class DeclineBookingRequest(val partnerId: String)
data class SyncCompleteRequest(
    val footageUrls: List<String>,
    val proxyFootageUrl: String? = null,
    val fileName: String? = null,
    val fileSize: Long? = null
)

data class AcceptBookingResponse(val booking: BookingDto)
data class DeclineBookingResponse(val booking: BookingDto, val reDispatched: Boolean)
data class SyncCompleteResponse(val success: Boolean, val booking: BookingDto?)

data class WalletTransactionDto(
    val id: String,
    val partnerId: String,
    val bookingId: String?,
    val type: String,
    val amount: Double,
    val status: String,
    val description: String?,
    val createdAt: String
)

data class WalletResponse(
    val balance: Double,
    val pendingClearance: Double,
    val totalWithdrawn: Double,
    val bankVerified: Boolean?,
    val bankName: String?,
    val accountNumberMasked: String?,
    val transactions: List<WalletTransactionDto>
)

data class LoginRequest(val email: String, val password: String? = null, val role: String? = "PARTNER")
data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val accessToken: String?,
    val refreshToken: String?,
    val user: UserDto?
)

data class RegisterRequest(
    val email: String,
    val password: String? = null,
    val name: String? = null,
    val phone: String? = null,
    val role: String? = "PARTNER",
    val deviceType: String? = "ANDROID"
)

// Matches backend's POST /auth/google (googleAuthHandler) — this is the ONLY call that
// should ever produce a real, backend-signed token + real partner id. Client-generated
// placeholder tokens are never accepted by the backend's JWT verification.
data class GoogleAuthRequest(
    val email: String,
    val name: String?,
    val photoURL: String? = null,
    val idToken: String? = null,
    val role: String = "PARTNER"
)

// ─── API Interface ───────────────────────────────────────────────────────────

interface ApiService {
    @POST("auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): VerifyOtpResponse

    @GET("bookings/available")
    suspend fun getAvailableBookings(
        @Header("Authorization") token: String,
        @Query("partnerId") partnerId: String
    ): List<BookingDto>

    @POST("partner/location")
    suspend fun updateLocation(
        @Header("Authorization") token: String,
        @Body request: LocationUpdateRequest
    ): LocationUpdateResponse

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/google")
    suspend fun googleAuth(@Body request: GoogleAuthRequest): LoginResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): LoginResponse

    @POST("bookings/{id}/accept")
    suspend fun acceptBooking(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String,
        @Body request: AcceptBookingRequest
    ): AcceptBookingResponse

    @POST("bookings/{id}/decline")
    suspend fun declineBooking(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String,
        @Body request: DeclineBookingRequest
    ): DeclineBookingResponse

    @POST("bookings/{id}/sync-complete")
    suspend fun completeSync(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String,
        @Body request: SyncCompleteRequest
    ): SyncCompleteResponse

    @GET("partners/{id}/wallet")
    suspend fun getPartnerWallet(
        @Header("Authorization") token: String,
        @Path("id") partnerId: String
    ): WalletResponse

    @GET("partners/{id}")
    suspend fun getPartnerProfile(
        @Header("Authorization") token: String,
        @Path("id") partnerId: String
    ): PartnerProfileDto

    @PATCH("partners/{id}")
    suspend fun updatePartnerProfile(
        @Header("Authorization") token: String,
        @Path("id") partnerId: String,
        @Body request: UpdatePartnerRequest
    ): PartnerProfileDto

    @POST("partners/link-bank")
    suspend fun linkBankAccount(
        @Header("Authorization") token: String,
        @Body request: LinkBankRequest
    ): LinkBankResponse

    @POST("partners/{id}/withdraw")
    suspend fun requestWithdrawal(
        @Header("Authorization") token: String,
        @Path("id") partnerId: String,
        @Body request: WithdrawalRequest
    ): WithdrawalResponse

    @POST("upload/presigned-url")
    suspend fun getPresignedUrl(
        @Header("Authorization") token: String,
        @Body request: PresignedUrlRequest
    ): PresignedUrlResponse
}
