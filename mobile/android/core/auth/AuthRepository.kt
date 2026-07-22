package com.orbitlogic.core.auth

import com.orbitlogic.client.network.ApiService
import com.orbitlogic.client.network.SendOtpRequest
import com.orbitlogic.client.network.VerifyOtpRequest
import com.orbitlogic.client.storage.PrefsManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val apiService: ApiService,
    private val prefsManager: PrefsManager
) {

    suspend fun requestOtp(email: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.sendOtp(SendOtpRequest(email))
            Result.success(response.success)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyOtp(email: String, otp: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.verifyOtp(VerifyOtpRequest(email, otp))
            prefsManager.saveAuthSession(response.token, response.user.role)
            Result.success(response.token)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        prefsManager.clearSession()
    }

    fun isLoggedIn(): Boolean = prefsManager.isLoggedIn()
}
