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

data class LoginRequest(val email: String, val password: String? = null, val role: String? = null)
data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val accessToken: String?,
    val refreshToken: String?,
    val redirectUrl: String?,
    val user: UserDto?
)

data class RegisterRequest(
    val email: String,
    val password: String? = null,
    val name: String? = null,
    val phone: String? = null,
    val role: String? = "CLIENT",
    val deviceType: String? = "ANDROID",
    val deviceId: String? = null,
    val appVersion: String? = null,
    val fcmToken: String? = null
)

data class ForgotPasswordRequest(val email: String)
data class ForgotPasswordResponse(val success: Boolean, val message: String)

data class ResetPasswordRequest(val email: String, val otp: String, val newPassword: String)
data class ResetPasswordResponse(val success: Boolean, val message: String)

data class RefreshTokenRequest(val refreshToken: String)
data class RefreshTokenResponse(val success: Boolean, val token: String, val accessToken: String, val refreshToken: String)

// Matches backend's POST /auth/google (googleAuthHandler) — this is the ONLY call that
// should ever produce a real, backend-signed token + real user id. Client-generated
// placeholder tokens are never accepted by the backend's JWT verification.
data class GoogleAuthRequest(
    val email: String,
    val name: String?,
    val photoURL: String? = null,
    val idToken: String? = null,
    val role: String = "CLIENT"
)

// ─── API Interface ───────────────────────────────────────────────────────────

interface ApiService {
    @POST("auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): SendOtpResponse

    @POST("auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): VerifyOtpResponse

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("auth/google")
    suspend fun googleAuth(@Body request: GoogleAuthRequest): LoginResponse

    @POST("auth/logout")
    suspend fun logout(@Header("Authorization") token: String): SendOtpResponse

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): LoginResponse

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): ForgotPasswordResponse

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): ResetPasswordResponse

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): RefreshTokenResponse

    @GET("auth/me")
    suspend fun getMe(@Header("Authorization") token: String): LoginResponse

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

    @PATCH("bookings/{id}")
    suspend fun updateBookingStatus(
        @Header("Authorization") token: String,
        @Path("id") bookingId: String,
        @Body request: UpdateBookingStatusRequest
    ): BookingDto
}

data class UpdateBookingStatusRequest(val status: String)
