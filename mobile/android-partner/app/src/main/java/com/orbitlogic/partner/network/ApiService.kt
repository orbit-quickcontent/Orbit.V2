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
    val createdAt: String
)

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

// ─── API Interface ───────────────────────────────────────────────────────────

interface ApiService {
    @POST("auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): VerifyOtpResponse

    @GET("bookings/available")
    suspend fun getAvailableBookings(@Header("Authorization") token: String): List<BookingDto>

    @POST("bookings/{id}/accept")
    suspend fun acceptBooking(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String
    ): BookingDto

    @POST("bookings/{id}/decline")
    suspend fun declineBooking(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String
    ): BookingDto

    @POST("bookings/{id}/sync-complete")
    suspend fun completeSync(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String
    ): BookingDto

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
