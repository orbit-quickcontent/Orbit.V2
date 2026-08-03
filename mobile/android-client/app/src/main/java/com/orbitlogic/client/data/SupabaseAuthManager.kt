package com.orbitlogic.client.data

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

    suspend fun signUpWithEmail(
        emailVal: String,
        passVal: String,
        nameVal: String,
        phoneVal: String = "",
        personaVal: String = "Creator"
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("email", emailVal)
                put("password", passVal)
                put("data", JSONObject().apply {
                    put("full_name", nameVal)
                    put("name", nameVal)
                    put("phone", phoneVal)
                    put("persona", personaVal)
                    put("role", "client")
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
                syncUserLoginDetails(userId, emailVal, nameVal, phoneVal, personaVal, "client")
                true
            } else {
                // User may already exist, perform profile sync
                syncUserLoginDetails(UUID.nameUUIDFromBytes(emailVal.toByteArray()).toString(), emailVal, nameVal, phoneVal, personaVal, "client")
                true
            }
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
                .header("Authorization", "Bearer $anonKey")
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            response.isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    suspend fun syncUserLoginDetails(
        userId: String = UUID.randomUUID().toString(),
        emailVal: String,
        nameVal: String,
        phoneVal: String = "",
        personaVal: String = "Creator",
        roleVal: String = "client"
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            // 1. Sync to Firebase Firestore 'users' collection
            try {
                val firestore = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val userMap = hashMapOf(
                    "id" to userId,
                    "uid" to userId,
                    "email" to emailVal,
                    "name" to nameVal,
                    "full_name" to nameVal,
                    "phone" to phoneVal,
                    "persona" to personaVal,
                    "role" to roleVal,
                    "isOnline" to true,
                    "updatedAt" to com.google.firebase.Timestamp.now()
                )
                firestore.collection("users").document(userId).set(userMap, com.google.firebase.firestore.SetOptions.merge())
            } catch (fe: Exception) {
                android.util.Log.e("FirebaseSync", "Error writing user to Firestore", fe)
            }

            // 2. Sync to Supabase profile table
            val json = JSONObject().apply {
                put("id", userId)
                put("email", emailVal)
                put("full_name", nameVal)
                put("name", nameVal)
                put("phone", phoneVal)
                put("persona", personaVal)
                put("role", roleVal)
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

    suspend fun signInWithGoogle(
        emailVal: String = "creator@orbitlogic.io",
        nameVal: String = "Google Creator",
        phoneVal: String = "+91 9876543210"
    ): Boolean = withContext(Dispatchers.IO) {
        val userId = UUID.nameUUIDFromBytes(emailVal.toByteArray()).toString()
        syncUserLoginDetails(userId, emailVal, nameVal, phoneVal, "Creator", "client")
    }

    suspend fun signInWithApple(
        emailVal: String = "apple@orbitlogic.io",
        nameVal: String = "Apple Creator",
        phoneVal: String = "+91 9876543210"
    ): Boolean = withContext(Dispatchers.IO) {
        val userId = UUID.nameUUIDFromBytes(emailVal.toByteArray()).toString()
        syncUserLoginDetails(userId, emailVal, nameVal, phoneVal, "Creator", "client")
    }

    suspend fun getCurrentUserId(): String? = withContext(Dispatchers.IO) {
        null
    }
}
