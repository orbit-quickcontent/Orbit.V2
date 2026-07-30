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
        // Replace with your actual PostHog project API key from posthog.com → Settings
        val config = PostHogAndroidConfig(
            apiKey = "phc_yLLboi9NdQU9rcdQanRyCqPDxwkHtmE7kU58eerTbMho",
            host = "https://us.i.posthog.com"
        )
        PostHogAndroid.setup(this, config)

        // Connection test event — check PostHog → Activity to verify
        PostHogAndroid.shared.capture(
            event = "connection_test",
            properties = mapOf("app" to "orbit-client-mobile")
        )

        println("[PostHog] Initialized for orbit-client-mobile. Check PostHog → Activity.")
    }
}
