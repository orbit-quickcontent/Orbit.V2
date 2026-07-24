package com.orbitlogic.client.data

import io.supabase.SupabaseClient
import io.supabase.gotrue.auth
import io.supabase.gotrue.providers.Apple
import io.supabase.gotrue.providers.Google
import io.supabase.gotrue.providers.builtin.Email

class SupabaseAuthManager(private val supabaseClient: SupabaseClient) {

    suspend fun signUpWithEmail(emailVal: String, passVal: String, nameVal: String): Boolean {
        return try {
            supabaseClient.auth.signUpWith(Email) {
                email = emailVal
                password = passVal
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun signInWithEmail(emailVal: String, passVal: String): Boolean {
        return try {
            supabaseClient.auth.signInWith(Email) {
                email = emailVal
                password = passVal
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun signInWithGoogle(): Boolean {
        return try {
            supabaseClient.auth.signInWith(Google)
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun signInWithApple(): Boolean {
        return try {
            supabaseClient.auth.signInWith(Apple)
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getCurrentUserId(): String? {
        return supabaseClient.auth.currentSessionOrNull()?.user?.id
    }
}
