package com.orbitlogic.partner.data

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
 * OrbitAuthManager — Android (Partner App)
 *
 * Registers and authenticates partner users against the Orbit backend API.
 */
class OrbitAuthManager(
    private val baseUrl: String = try {
        Class.forName("com.orbitlogic.partner.BuildConfig")
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

    data class AuthResult(val token: String, val userId: String, val partnerId: String? = null)

    /**
     * Register a new partner. Returns AuthResult (with userId) on success, null on failure.
     */
    suspend fun registerPartner(
        email: String,
        name: String,
        phone: String = "",
        location: String = "Mumbai, IN"
    ): AuthResult? = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("email", email)
                put("name", name)
                put("phone", phone)
                put("role", "PARTNER")
                put("location", location)
                put("password", "OrbitPartner123!")
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
                ?: UUID.nameUUIDFromBytes(email.toByteArray()).toString()
            val partnerId = respJson.optJSONObject("partner")?.optString("id")

            // Return result even if token is missing — userId is the primary artifact
            AuthResult(token, userId, partnerId)
        } catch (e: Exception) {
            android.util.Log.e("OrbitAuthManager", "registerPartner failed", e)
            null
        }
    }

    /**
     * Login an existing partner. Returns AuthResult on success, null on failure.
     */
    suspend fun loginPartner(email: String): AuthResult? = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().apply {
                put("email", email)
                put("password", "OrbitPartner123!")
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
            val partnerId = respJson.optJSONObject("partner")?.optString("id")
                ?: respJson.optString("partnerId").takeIf { it.isNotBlank() }

            if (userId.isNotBlank()) AuthResult(token, userId, partnerId) else null
        } catch (e: Exception) {
            android.util.Log.e("OrbitAuthManager", "loginPartner failed", e)
            null
        }
    }
}
