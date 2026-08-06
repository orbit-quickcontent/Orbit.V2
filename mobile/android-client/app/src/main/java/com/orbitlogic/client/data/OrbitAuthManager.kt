package com.orbitlogic.client.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.TimeUnit

/**
 * OrbitAuthManager — Android (Client App)
 *
 * Authenticates users against the Orbit backend API (/api/auth/register, /api/auth/login,
 * /api/auth/google). Replaces the old SupabaseAuthManager.
 *
 * The base URL is set via BuildConfig.ORBIT_API_URL if available, otherwise defaults
 * to the production API. Override in local debug builds via a buildConfigField in build.gradle.
 */
class OrbitAuthManager(
    private val baseUrl: String = try {
        // Reflects BuildConfig.ORBIT_API_URL if the build script defines it
        Class.forName("com.orbitlogic.client.BuildConfig")
            .getField("ORBIT_API_URL").get(null) as? String
            ?: "https://app.orbit-quickcontent.com/api"
    } catch (_: Exception) {
        "https://app.orbit-quickcontent.com/api"
    }
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
    private val json = "application/json; charset=utf-8".toMediaType()

    data class AuthResult(val token: String, val userId: String)

    /**
     * Register a new client user. Returns AuthResult on success, null on failure.
     */
    suspend fun registerWithEmail(
        email: String,
        name: String,
        phone: String = "",
        role: String = "CLIENT"
    ): AuthResult? = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("email", email)
                put("name", name)
                put("phone", phone)
                put("role", role)
                put("password", "OrbitClient123!")
            }.toString().toRequestBody(json)

            val response = client.newCall(
                Request.Builder()
                    .url("$baseUrl/auth/register")
                    .post(body)
                    .build()
            ).execute()

            val respStr = response.body?.string() ?: return@withContext null
            val respJson = JSONObject(respStr)
            val token = respJson.optString("token")
                .ifBlank { respJson.optJSONObject("data")?.optString("token") ?: "" }
            val userId = respJson.optJSONObject("user")?.optString("id")
                ?: respJson.optString("userId")

            if (token.isNotBlank() && userId.isNotBlank()) AuthResult(token, userId) else null
        } catch (e: Exception) {
            android.util.Log.e("OrbitAuthManager", "registerWithEmail failed", e)
            null
        }
    }

    /**
     * Sign in via email+password. Returns AuthResult on success, null on failure.
     */
    suspend fun loginWithEmail(email: String): AuthResult? = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("email", email)
                put("password", "OrbitClient123!")
            }.toString().toRequestBody(json)

            val response = client.newCall(
                Request.Builder()
                    .url("$baseUrl/auth/login")
                    .post(body)
                    .build()
            ).execute()

            val respStr = response.body?.string() ?: return@withContext null
            val respJson = JSONObject(respStr)
            val token = respJson.optString("token").ifBlank { "" }
            val userId = respJson.optJSONObject("user")?.optString("id") ?: ""

            if (token.isNotBlank() && userId.isNotBlank()) AuthResult(token, userId) else null
        } catch (e: Exception) {
            android.util.Log.e("OrbitAuthManager", "loginWithEmail failed", e)
            null
        }
    }

    /**
     * Authenticate via Google OAuth info. Returns AuthResult on success, null on failure.
     */
    suspend fun loginWithGoogle(
        email: String,
        name: String,
        phone: String = ""
    ): AuthResult? = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("email", email)
                put("name", name)
                put("phone", phone)
                put("role", "CLIENT")
            }.toString().toRequestBody(json)

            val response = client.newCall(
                Request.Builder()
                    .url("$baseUrl/auth/google")
                    .post(body)
                    .build()
            ).execute()

            val respStr = response.body?.string() ?: return@withContext null
            val respJson = JSONObject(respStr)
            val token = respJson.optString("token")
                .ifBlank { respJson.optJSONObject("data")?.optString("token") ?: "" }
            val userId = respJson.optJSONObject("user")?.optString("id")
                ?: UUID.nameUUIDFromBytes(email.toByteArray()).toString()

            if (token.isNotBlank()) AuthResult(token, userId) else null
        } catch (e: Exception) {
            android.util.Log.e("OrbitAuthManager", "loginWithGoogle failed", e)
            null
        }
    }

    /**
     * Apple OAuth — calls the same /auth/google endpoint with role=CLIENT.
     * Replace with /auth/apple when the backend adds Apple-specific token verification.
     */
    suspend fun loginWithApple(email: String, name: String): AuthResult? =
        loginWithGoogle(email, name)
}
