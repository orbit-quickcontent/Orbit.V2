package com.orbitlogic.partner

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OrbitPartnerApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        
        // Prevent hard app crashes from uncaught background exceptions
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("OrbitPartnerApp", "Uncaught exception in thread ${thread.name}", throwable)
        }

        initFirebase()
        initPostHog()
    }

    private fun initFirebase() {
        try {
            FirebaseApp.initializeApp(this)
            Log.d("OrbitPartnerApp", "Firebase initialized successfully.")
        } catch (t: Throwable) {
            Log.w("OrbitPartnerApp", "Firebase init skipped: ${t.localizedMessage}")
        }
    }

    private fun initPostHog() {
        try {
            val config = PostHogAndroidConfig(
                apiKey = "phc_yLLboi9NdQU9rcdQanRyCqPDxwkHtmE7kU58eerTbMho",
                host = "https://us.i.posthog.com"
            )
            PostHogAndroid.setup(this, config)
            Log.d("OrbitPartnerApp", "PostHog initialized successfully.")
        } catch (t: Throwable) {
            Log.w("OrbitPartnerApp", "PostHog init skipped: ${t.localizedMessage}")
        }
    }
}
