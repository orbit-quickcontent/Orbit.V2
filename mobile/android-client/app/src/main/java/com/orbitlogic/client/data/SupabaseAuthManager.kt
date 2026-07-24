package com.orbitlogic.client.data

import io.supabase.SupabaseClient
import io.supabase.gotrue.auth

class SupabaseAuthManager(private val supabaseClient: SupabaseClient) {

    suspend fun signUpWithEmail(emailVal: String, passVal: String, nameVal: String): Boolean {
        return try {
            supabaseClient.auth.signUpWith(io.supabase.gotrue.providers.builtin.Email) {
                email = emailVal
                password = passVal
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getCurrentUserId(): String? {
        return supabaseClient.auth.currentSessionOrNull()?.user?.id
    }
}
