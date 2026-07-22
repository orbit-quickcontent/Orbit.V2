package com.orbitlogic.partner.storage

import android.content.Context
import android.content.SharedPreferences

class PrefsManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("orbit_partner_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_PARTNER_ID = "partner_id"
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
    }

    fun saveAuthSession(token: String, partnerId: String?) {
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_PARTNER_ID, partnerId)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getAuthToken(): String? {
        return prefs.getString(KEY_TOKEN, null)
    }

    fun getPartnerId(): String? {
        return prefs.getString(KEY_PARTNER_ID, null)
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_TOKEN)
            remove(KEY_PARTNER_ID)
            putBoolean(KEY_IS_LOGGED_IN, false)
            apply()
        }
    }
}
