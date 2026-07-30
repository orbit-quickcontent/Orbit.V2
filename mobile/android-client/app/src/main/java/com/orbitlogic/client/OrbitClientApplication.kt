package com.orbitlogic.client

import android.app.Application
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OrbitClientApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        initPostHog()
    }

    private fun initPostHog() {
        try {
            val config = PostHogAndroidConfig(
                apiKey = "phc_yLLboi9NdQU9rcdQanRyCqPDxwkHtmE7kU58eerTbMho",
                host = "https://us.i.posthog.com"
            )
            PostHogAndroid.setup(this, config)
            println("[PostHog] Initialized for orbit-client-mobile.")
        } catch (e: Exception) {
            println("[PostHog] Init skipped: ${e.message}")
        }
    }
}

