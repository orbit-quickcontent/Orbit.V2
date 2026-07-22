package com.orbitlogic.client.network

import retrofit2.http.*

// ─── Data Transfer Objects ───────────────────────────────────────────────────

data class SendOtpRequest(val email: String)
data class SendOtpResponse(val success: Boolean, val message: String)

data class VerifyOtpRequest(val email: String, val otp: String)
data class VerifyOtpResponse(
    val token: String,
    val user: UserDto
)

data class UserDto(
    val id: String,
    val email: String,
    val name: String?,
    val phone: String?,
    val role: String,
    val brandLogo: String?,
    val brandFont: String?,
    val brandColor: String?,
    val editorRequirements: String?,
    val avatar: String?
)

data class PackageDto(
    val id: String,
    val name: String,
    val tier: String,
    val price: Int,
    val focus: String,
    val deliveryTime: String,
    val features: List<String>,
    val popular: Boolean
)

data class BookingDto(
    val id: String,
    val userId: String,
    val packageId: String,
    val partnerId: String?,
    val status: String,
    val paymentStatus: String,
    val paymentId: String?,
    val paymentMethod: String?,
    val bookingDate: String,
    val timeSlot: String,
    val location: String?,
    val syncPercentage: Int,
    val editCountdown: Int?,
    val notes: String?,
    val masterReelUrl: String?,
    val proxyFootageUrl: String?,
    val createdAt: String
)

data class CreateBookingRequest(
    val packageId: String,
    val bookingDate: String,
    val timeSlot: String,
    val location: String,
    val notes: String?
)

data class UpdateUserRequest(
    val name: String?,
    val phone: String?,
    val brandLogo: String?,
    val brandFont: String?,
    val brandColor: String?,
    val editorRequirements: String?
)

// ─── API Interface ───────────────────────────────────────────────────────────

interface ApiService {
    @POST("auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): VerifyOtpResponse

    @GET("users")
    suspend fun getCurrentUser(@Header("Authorization") token: String): UserDto

    @POST("users")
    suspend fun updateUserProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateUserRequest
    ): UserDto

    @GET("packages")
    suspend fun getPackages(): List<PackageDto>

    @GET("bookings")
    suspend fun getBookings(@Header("Authorization") token: String): List<BookingDto>

    @POST("bookings")
    suspend fun createBooking(
        @Header("Authorization") token: String,
        @Body request: CreateBookingRequest
    ): BookingDto

    @GET("bookings/{id}")
    suspend fun getBookingDetails(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String
    ): BookingDto

    @GET("bookings/{id}/track")
    suspend fun trackBooking(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String
    ): BookingDto
}
