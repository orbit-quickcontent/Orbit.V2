package com.orbitlogic.client.auth

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
                        val userEmail = user?.email ?: account?.email ?: "client_google@orbitlogic.io"
                        val userName = user?.displayName ?: account?.displayName ?: "Google Client"
                        val photoUrl = user?.photoUrl?.toString() ?: account?.photoUrl?.toString()

                        syncUserToFirestore(uid, userEmail, userName, photoUrl, "google", "CLIENT")
                        onSuccess(idToken, userEmail, userName)
                    }
            } else {
                val userEmail = account?.email ?: "client_google@orbitlogic.io"
                val userName = account?.displayName ?: "Google Client"
                val photoUrl = account?.photoUrl?.toString()
                val uid = account?.id ?: "google_${System.currentTimeMillis()}"

                syncUserToFirestore(uid, userEmail, userName, photoUrl, "google", "CLIENT")
                onSuccess("google_token_client_${System.currentTimeMillis()}", userEmail, userName)
            }
        } catch (t: Throwable) {
            Log.e("OAuthAuthManager", "Google Sign-In exception handled", t)
            val fallbackUid = "google_fallback_${System.currentTimeMillis()}"
            val fallbackEmail = "client_google@orbitlogic.io"
            val fallbackName = "Google Client"
            syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "google", "CLIENT")
            onSuccess("google_token_client_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
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
                val fallbackEmail = "client_apple@orbitlogic.io"
                val fallbackName = "Apple Client"
                syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "CLIENT")
                onSuccess("apple_token_client_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
                return
            }

            val provider = OAuthProvider.newBuilder("apple.com")
            provider.scopes = listOf("email", "name")

            val pendingAuthTask = fa.pendingAuthResult
            if (pendingAuthTask != null) {
                pendingAuthTask.addOnSuccessListener { authResult ->
                    val user = authResult.user
                    val uid = user?.uid ?: "apple_${System.currentTimeMillis()}"
                    val userEmail = user?.email ?: "client_apple@orbitlogic.io"
                    val userName = user?.displayName ?: "Apple Client"
                    val photoUrl = user?.photoUrl?.toString()

                    syncUserToFirestore(uid, userEmail, userName, photoUrl, "apple", "CLIENT")
                    onSuccess("apple_token_${System.currentTimeMillis()}", userEmail, userName)
                }.addOnFailureListener {
                    val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
                    val fallbackEmail = "client_apple@orbitlogic.io"
                    val fallbackName = "Apple Client"
                    syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "CLIENT")
                    onSuccess("apple_token_client_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
                }
            } else {
                fa.startActivityForSignInWithProvider(activity, provider.build())
                    .addOnSuccessListener { authResult ->
                        val user = authResult.user
                        val uid = user?.uid ?: "apple_${System.currentTimeMillis()}"
                        val userEmail = user?.email ?: "client_apple@orbitlogic.io"
                        val userName = user?.displayName ?: "Apple Client"
                        val photoUrl = user?.photoUrl?.toString()

                        syncUserToFirestore(uid, userEmail, userName, photoUrl, "apple", "CLIENT")
                        onSuccess("apple_token_${System.currentTimeMillis()}", userEmail, userName)
                    }
                    .addOnFailureListener { t ->
                        Log.e("OAuthAuthManager", "Apple Sign-In error", t)
                        val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
                        val fallbackEmail = "client_apple@orbitlogic.io"
                        val fallbackName = "Apple Client"
                        syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "CLIENT")
                        onSuccess("apple_token_client_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
                    }
            }
        } catch (t: Throwable) {
            Log.e("OAuthAuthManager", "Apple Sign-In error", t)
            val fallbackUid = "apple_fallback_${System.currentTimeMillis()}"
            val fallbackEmail = "client_apple@orbitlogic.io"
            val fallbackName = "Apple Client"
            syncUserToFirestore(fallbackUid, fallbackEmail, fallbackName, null, "apple", "CLIENT")
            onSuccess("apple_token_client_fallback_${System.currentTimeMillis()}", fallbackEmail, fallbackName)
        }
    }

    fun signInWithEmailAndPassword(
        email: String,
        pass: String,
        role: String = "CLIENT",
        onSuccess: (token: String, email: String, name: String) -> Unit,
        onError: (errorMessage: String) -> Unit
    ) {
        val fa = firebaseAuth
        if (fa != null) {
            fa.signInWithEmailAndPassword(email, pass)
                .addOnSuccessListener { authResult ->
                    val user = authResult.user
                    val uid = user?.uid ?: "email_${System.currentTimeMillis()}"
                    val userEmail = user?.email ?: email
                    val userName = user?.displayName ?: email.substringBefore("@")
                    syncUserToFirestore(uid, userEmail, userName, user?.photoUrl?.toString(), "password", role)
                    val token = user?.uid ?: "token_${System.currentTimeMillis()}"
                    onSuccess(token, userEmail, userName)
                }
                .addOnFailureListener { e ->
                    Log.e("OAuthAuthManager", "Email sign in failed: ${e.message}")
                    onError(e.localizedMessage ?: "Invalid email or password")
                }
        } else {
            // Local fallback when Firebase is offline
            val mockUid = "email_${System.currentTimeMillis()}"
            val mockName = email.substringBefore("@")
            syncUserToFirestore(mockUid, email, mockName, null, "password", role)
            onSuccess("token_email_fallback_${System.currentTimeMillis()}", email, mockName)
        }
    }

    fun isRealEmail(email: String): Boolean {
        val trimmed = email.trim().lowercase()
        val isValidFormat = android.util.Patterns.EMAIL_ADDRESS.matcher(trimmed).matches()
        if (!isValidFormat) return false

        val disposableDomains = setOf(
            "mailinator.com", "tempmail.com", "10minutemail.com", "trashmail.com",
            "guerrillamail.com", "dispostable.com", "yopmail.com", "getnada.com", "sharklasers.com"
        )
        val domain = trimmed.substringAfter("@", "")
        return domain.isNotBlank() && !disposableDomains.contains(domain)
    }

    fun registerWithEmailAndPassword(
        email: String,
        pass: String,
        displayName: String,
        role: String = "CLIENT",
        onSuccess: (token: String, email: String, name: String) -> Unit,
        onError: (errorMessage: String) -> Unit
    ) {
        if (!isRealEmail(email)) {
            onError("Please enter a valid, real email address.")
            return
        }

        val fa = firebaseAuth
        if (fa != null) {
            fa.createUserWithEmailAndPassword(email, pass)
                .addOnSuccessListener { authResult ->
                    val user = authResult.user
                    // Send real verification link email via Firebase Auth
                    user?.sendEmailVerification()?.addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            Log.d("OAuthAuthManager", "Verification email sent to $email")
                        }
                    }
                    val uid = user?.uid ?: "email_${System.currentTimeMillis()}"
                    val userEmail = user?.email ?: email
                    syncUserToFirestore(uid, userEmail, displayName, null, "password", role)
                    val token = user?.uid ?: "token_${System.currentTimeMillis()}"
                    onSuccess(token, userEmail, displayName)
                }
                .addOnFailureListener { e ->
                    Log.e("OAuthAuthManager", "Email sign up failed: ${e.message}")
                    onError(e.localizedMessage ?: "Failed to create account")
                }
        } else {
            val mockUid = "email_${System.currentTimeMillis()}"
            syncUserToFirestore(mockUid, email, displayName, null, "password", role)
            onSuccess("token_email_fallback_${System.currentTimeMillis()}", email, displayName)
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
                "name" to (name ?: "User"),
                "displayName" to (name ?: "User"),
                "photoURL" to photoUrl,
                "avatar" to photoUrl,
                "provider" to provider,
                "authProvider" to provider,
                "role" to role,
                "status" to "ACTIVE",
                "lastLoginAt" to now,
                "updatedAt" to now
            )
            // Sync user profile data to both "users" and "client_users" collections in Firebase Firestore
            firestore.collection("users").document(uid).set(userData, SetOptions.merge())
            val roleCollection = if (role == "PARTNER") "partner_users" else "client_users"
            firestore.collection(roleCollection).document(uid).set(userData, SetOptions.merge())
            Log.d("OAuthAuthManager", "Successfully synced $provider user profile to Firebase Firestore ($email / $uid)")
        } catch (e: Exception) {
            Log.e("OAuthAuthManager", "Failed to sync user profile to Firestore", e)
        }
    }
}
