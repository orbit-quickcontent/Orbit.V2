package com.orbitlogic.client.storage

import android.content.Context
import android.content.SharedPreferences

class PrefsManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("orbit_client_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_SAVED_NAME = "saved_name"
        private const val KEY_SAVED_PHONE = "saved_phone"
        private const val KEY_ONBOARDING_DONE = "onboarding_done"
    }

    fun saveAuthSession(token: String, role: String) {
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_ROLE, role)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun saveUserId(userId: String) {
        prefs.edit().putString(KEY_USER_ID, userId).apply()
    }

    fun getUserId(): String? {
        return prefs.getString(KEY_USER_ID, null)
    }

    fun getAuthToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }

    fun getUserRole(): String? {
        return prefs.getString(KEY_USER_ROLE, null)
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_TOKEN)
            remove(KEY_USER_ROLE)
            putBoolean(KEY_IS_LOGGED_IN, false)
            apply()
        }
    }

    fun saveName(name: String) {
        prefs.edit().putString(KEY_SAVED_NAME, name).apply()
    }

    fun getSavedName(): String? {
        return prefs.getString(KEY_SAVED_NAME, null)
    }

    fun savePhone(phone: String) {
        prefs.edit().putString(KEY_SAVED_PHONE, phone).apply()
    }

    fun getSavedPhone(): String? {
        return prefs.getString(KEY_SAVED_PHONE, null)
    }

    fun setOnboardingDone() {
        prefs.edit().putBoolean(KEY_ONBOARDING_DONE, true).apply()
    }

    fun isOnboardingComplete(): Boolean {
        return prefs.getBoolean(KEY_ONBOARDING_DONE, false)
    }
}
