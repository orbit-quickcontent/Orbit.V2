package com.orbitlogic.partner

import android.app.Application
import com.posthog.android.PostHog
import com.posthog.android.PostHogAndroidConfig
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class OrbitPartnerApplication : Application() {

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
        PostHog.setup(this, config)

        // Connection test event — check PostHog → Activity to verify
        PostHog.capture(
            event = "connection_test",
            properties = mapOf("app" to "orbit-partner-mobile")
        )

        println("[PostHog] Initialized for orbit-partner-mobile. Check PostHog → Activity.")
    }
}
