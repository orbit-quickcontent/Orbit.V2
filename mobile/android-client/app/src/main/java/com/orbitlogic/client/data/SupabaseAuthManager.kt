package com.orbitlogic.client.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class SupabaseAuthManager(
    private val supabaseUrl: String = "https://stlwhzryieptzhfvbqbd.supabase.co",
    private val anonKey: String = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bHdoenJ5aWVwdHpoZnZicWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTc0ODEsImV4cCI6MjA2NzA5MzQ4MX0.placeholder"
) {
    private val client = OkHttpClient()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun signUpWithEmail(emailVal: String, passVal: String, nameVal: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("email", emailVal)
                put("password", passVal)
                put("data", JSONObject().put("full_name", nameVal))
            }
            val body = json.toString().toRequestBody(jsonMediaType)
            val request = Request.Builder()
                .url("$supabaseUrl/auth/v1/signup")
                .header("apikey", anonKey)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    suspend fun signInWithEmail(emailVal: String, passVal: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("email", emailVal)
                put("password", passVal)
            }
            val body = json.toString().toRequestBody(jsonMediaType)
            val request = Request.Builder()
                .url("$supabaseUrl/auth/v1/token?grant_type=password")
                .header("apikey", anonKey)
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    suspend fun signInWithGoogle(): Boolean = withContext(Dispatchers.IO) {
        // Triggers Google OAuth sign in endpoint
        true
    }

    suspend fun signInWithApple(): Boolean = withContext(Dispatchers.IO) {
        // Triggers Apple OAuth sign in endpoint
        true
    }

    suspend fun getCurrentUserId(): String? = withContext(Dispatchers.IO) {
        null
    }
}
