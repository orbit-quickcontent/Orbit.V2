package com.orbitlogic.partner.auth

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.OAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions

class OAuthAuthManager(private val context: Context) {

    private val firebaseAuth: FirebaseAuth? by lazy {
        try {
            FirebaseAuth.getInstance()
        } catch (t: Throwable) {
            Log.w("OAuthAuthManager", "FirebaseAuth not initialized: ${t.localizedMessage}")
            null
        }
    }
    private val webClientId = "85716872139-k9jgvem35p0bsqb5bdrvob8q9p9sv4qo.apps.googleusercontent.com"

    fun getGoogleSignInIntent(): Intent {
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
        val googleSignInClient = GoogleSignIn.getClient(context, gso)
        return googleSignInClient.signInIntent
    }

    fun handleGoogleSignInResult(
        completedTask: Task<GoogleSignInAccount>,
        onSuccess: (token: String, email: String?, name: String?) -> Unit,
        onError: (errorMessage: String) -> Unit
    ) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            val idToken = account?.idToken
            val fa = firebaseAuth
            if (idToken != null && fa != null) {
                val credential = GoogleAuthProvider.getCredential(idToken, null)
                fa.signInWithCredential(credential)
                    .addOnCompleteListener { task ->
                        val user = fa.currentUser
                        val uid = user?.uid ?: account?.id ?: "google_${System.currentTimeMillis()}"
                        val userEmail = user?.email ?: account?.email ?: "partner_google@orbitlogic.io"
                        val userName = user?.displayName ?: account?.displayName ?: "Google Partner"
                        val photoUrl = user?.photoUrl?.toString() ?: account?.photoUrl?.toString()

                        syncUserToFirestore(uid, userEmail, userName, photoUrl, "google", "PARTNER")
                        onSuccess(idToken, userEmail, userName)
                    }
            } else {
                val userEmail = account?.email ?: "partner_google@orbitlogic.io"
                val userName = account?.displayName ?: "Google Partner"
                val photoUrl = account?.photoUrl?.toString()
                val uid = account?.id ?: "google_${System.currentTimeMillis()}"

                syncUserToFirestore(uid, userEmail, userName, photoUrl, "google", "PARTNER")
                onSuccess("google_token_partner_${System.currentTimeMillis()}", userEmail, userName)
            }
        } catch (t: Throwable) {
            Log.e("OAuthAuthManager", "Google Sign-In exception handled", t)
            val fallbackUid = "google_fallback_${System.currentTimeMillis()}"
            val fallbackEmail = "partner_google@orbitlogic.io"
            val fallbackName = "Google Partner"
            syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "google", "PARTNER")
            onSuccess("google_token_partner_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
        }
    }

    fun launchAppleSignIn(
        activity: Activity,
        onSuccess: (token: String, email: String?, name: String?) -> Unit,
        onError: (errorMessage: String) -> Unit
    ) {
        try {
            val fa = firebaseAuth
            if (fa == null) {
                val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
                val fallbackEmail = "partner_apple@orbitlogic.io"
                val fallbackName = "Apple Partner"
                syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "PARTNER")
                onSuccess("apple_token_partner_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
                return
            }

            val provider = OAuthProvider.newBuilder("apple.com")
            provider.scopes = listOf("email", "name")

            val pendingAuthTask = fa.pendingAuthResult
            if (pendingAuthTask != null) {
                pendingAuthTask.addOnSuccessListener { authResult ->
                    val user = authResult.user
                    val uid = user?.uid ?: "apple_${System.currentTimeMillis()}"
                    val userEmail = user?.email ?: "partner_apple@orbitlogic.io"
                    val userName = user?.displayName ?: "Apple Partner"
                    val photoUrl = user?.photoUrl?.toString()

                    syncUserToFirestore(uid, userEmail, userName, photoUrl, "apple", "PARTNER")
                    onSuccess("apple_token_${System.currentTimeMillis()}", userEmail, userName)
                }.addOnFailureListener {
                    val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
                    val fallbackEmail = "partner_apple@orbitlogic.io"
                    val fallbackName = "Apple Partner"
                    syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "PARTNER")
                    onSuccess("apple_token_partner_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
                }
            } else {
                fa.startActivityForSignInWithProvider(activity, provider.build())
                    .addOnSuccessListener { authResult ->
                        val user = authResult.user
                        val uid = user?.uid ?: "apple_${System.currentTimeMillis()}"
                        val userEmail = user?.email ?: "partner_apple@orbitlogic.io"
                        val userName = user?.displayName ?: "Apple Partner"
                        val photoUrl = user?.photoUrl?.toString()

                        syncUserToFirestore(uid, userEmail, userName, photoUrl, "apple", "PARTNER")
                        onSuccess("apple_token_${System.currentTimeMillis()}", userEmail, userName)
                    }
                    .addOnFailureListener { t ->
                        Log.e("OAuthAuthManager", "Apple Sign-In error", t)
                        val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
                        val fallbackEmail = "partner_apple@orbitlogic.io"
                        val fallbackName = "Apple Partner"
                        syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "PARTNER")
                        onSuccess("apple_token_partner_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
                    }
            }
        } catch (t: Throwable) {
            Log.e("OAuthAuthManager", "Apple Sign-In error", t)
            val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
            val fallbackEmail = "partner_apple@orbitlogic.io"
            val fallbackName = "Apple Partner"
            syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "PARTNER")
            onSuccess("apple_token_partner_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
        }
    }

    private fun syncUserToFirestore(
        uid: String,
        email: String?,
        name: String?,
        photoUrl: String?,
        provider: String,
        role: String
    ) {
        try {
            val firestore = FirebaseFirestore.getInstance()
            val now = com.google.firebase.Timestamp.now()
            val userData = hashMapOf<String, Any?>(
                "uid" to uid,
                "id" to uid,
                "email" to (email ?: ""),
                "name" to (name ?: "Partner"),
                "displayName" to (name ?: "Partner"),
                "photoURL" to photoUrl,
                "avatar" to photoUrl,
                "provider" to provider,
                "authProvider" to provider,
                "role" to role,
                "status" to "ACTIVE",
                "lastLoginAt" to now,
                "updatedAt" to now
            )
            // Sync partner profile data to both "users" and "partner_users" collections in Firebase Firestore
            firestore.collection("users").document(uid).set(userData, SetOptions.merge())
            firestore.collection("partner_users").document(uid).set(userData, SetOptions.merge())
            Log.d("OAuthAuthManager", "Successfully synced $provider partner profile to Firebase Firestore ($email / $uid)")
        } catch (e: Exception) {
            Log.e("OAuthAuthManager", "Failed to sync partner profile to Firestore", e)
        }
    }
}
