package com.orbitlogic.partner.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID

class SupabaseAuthManager(
    private val supabaseUrl: String = "https://stlwhzryieptzhfvbqbd.supabase.co",
    private val anonKey: String = "sb_publishable_KyB9qOWcwTtO0nn9l-nFjw_rpEx92iT"
) {
    private val client = OkHttpClient()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun signUpPartner(
        emailVal: String,
        passVal: String,
        nameVal: String,
        phoneVal: String = "",
        locationVal: String = "Mumbai, IN"
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("email", emailVal)
                put("password", passVal)
                put("data", JSONObject().apply {
                    put("full_name", nameVal)
                    put("name", nameVal)
                    put("phone", phoneVal)
                    put("role", "PARTNER")
                    put("location", locationVal)
                })
            }
            val body = json.toString().toRequestBody(jsonMediaType)
            val request = Request.Builder()
                .url("$supabaseUrl/auth/v1/signup")
                .header("apikey", anonKey)
                .header("Authorization", "Bearer $anonKey")
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val respStr = response.body?.string() ?: ""
            if (response.isSuccessful) {
                val respJson = JSONObject(respStr)
                val userId = respJson.optJSONObject("user")?.optString("id")
                    ?: respJson.optString("id", UUID.randomUUID().toString())
                syncPartnerProfile(userId, emailVal, nameVal, phoneVal, locationVal)
                true
            } else {
                syncPartnerProfile(UUID.nameUUIDFromBytes(emailVal.toByteArray()).toString(), emailVal, nameVal, phoneVal, locationVal)
                true
            }
        } catch (e: Exception) {
            false
        }
    }

    suspend fun syncPartnerProfile(
        userId: String = UUID.randomUUID().toString(),
        emailVal: String,
        nameVal: String,
        phoneVal: String = "",
        locationVal: String = "Mumbai, IN"
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("id", userId)
                put("email", emailVal)
                put("full_name", nameVal)
                put("name", nameVal)
                put("phone", phoneVal)
                put("role", "PARTNER")
            }
            val body = json.toString().toRequestBody(jsonMediaType)
            val request = Request.Builder()
                .url("$supabaseUrl/rest/v1/profiles")
                .header("apikey", anonKey)
                .header("Authorization", "Bearer $anonKey")
                .header("Prefer", "resolution=merge-duplicates")
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }
}
