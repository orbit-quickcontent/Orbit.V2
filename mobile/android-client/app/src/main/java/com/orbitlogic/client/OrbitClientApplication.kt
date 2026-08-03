package com.orbitlogic.client

import android.app.Application
import android.util.Log
import com.google.firebase.FirebaseApp
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OrbitClientApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        
        // Safely log uncaught exceptions while delegating to system default handler
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("OrbitClientApp", "Uncaught exception in thread ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }

        initFirebase()
        initPostHog()
    }

    private fun initFirebase() {
        try {
            FirebaseApp.initializeApp(this)
            Log.d("OrbitClientApp", "Firebase initialized successfully.")
        } catch (t: Throwable) {
            Log.w("OrbitClientApp", "Firebase init skipped: ${t.localizedMessage}")
        }
    }

    private fun initPostHog() {
        try {
            val config = PostHogAndroidConfig(
                apiKey = "phc_yLLboi9NdQU9rcdQanRyCqPDxwkHtmE7kU58eerTbMho",
                host = "https://us.i.posthog.com"
            )
            PostHogAndroid.setup(this, config)
            Log.d("OrbitClientApp", "PostHog initialized successfully.")
        } catch (t: Throwable) {
            Log.w("OrbitClientApp", "PostHog init skipped: ${t.localizedMessage}")
        }
    }
}
