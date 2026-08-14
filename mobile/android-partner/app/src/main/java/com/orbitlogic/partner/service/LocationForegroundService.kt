package com.orbitlogic.partner.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.orbitlogic.partner.R
import com.orbitlogic.partner.network.ApiClient
import com.orbitlogic.partner.network.LocationUpdateRequest
import com.orbitlogic.partner.network.SocketManager
import com.orbitlogic.partner.storage.PrefsManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class LocationForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private val socketManager by lazy { SocketManager() }
    private lateinit var prefsManager: PrefsManager

    companion object {
        const val CHANNEL_ID = "orbit_location_tracking_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START_LOCATION_SERVICE"
        const val ACTION_STOP = "ACTION_STOP_LOCATION_SERVICE"
    }

    override fun onCreate() {
        super.onCreate()
        prefsManager = PrefsManager(applicationContext)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        createNotificationChannel()

        val partnerId = prefsManager.getPartnerId() ?: ""
        val token = prefsManager.getAuthToken() ?: ""
        if (partnerId.isNotBlank() && token.isNotBlank()) {
            socketManager.connect(partnerId, token) { _, _ -> }
        }

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation ?: return
                val currentPartnerId = prefsManager.getPartnerId() ?: return
                val currentToken = prefsManager.getAuthToken() ?: ""

                // 1. Emit live GPS over WebSocket
                socketManager.sendLocationUpdate(
                    partnerId = currentPartnerId,
                    lat = location.latitude,
                    lng = location.longitude,
                    heading = if (location.hasBearing()) location.bearing.toDouble() else null,
                    speed = if (location.hasSpeed()) location.speed.toDouble() else null
                )

                // 2. HTTP Fallback update (Fire-and-forget)
                if (currentToken.isNotBlank()) {
                    serviceScope.launch {
                        try {
                            ApiClient.apiService.updatePartnerLocation(
                                token = if (currentToken.startsWith("Bearer ")) currentToken else "Bearer $currentToken",
                                request = LocationUpdateRequest(
                                    latitude = location.latitude,
                                    longitude = location.longitude,
                                    speed = location.speed,
                                    heading = location.bearing
                                )
                            )
                        } catch (e: Exception) {
                            Log.w("LocationService", "HTTP fallback ping failed: ${e.message}")
                        }
                    }
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopLocationUpdates()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            else -> {
                startForeground(NOTIFICATION_ID, createNotification())
                startLocationUpdates()
            }
        }
        return START_STICKY
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5000L // 5 seconds interval
        ).apply {
            setMinUpdateIntervalMillis(3000L) // Rate limit 3s
            setMinUpdateDistanceMeters(5f)     // 5 meters distance filter
        }.build()

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
            Log.d("LocationService", "Continuous background GPS updates started")
        } catch (unlikely: SecurityException) {
            Log.e("LocationService", "Lost location permission. Could not request updates. $unlikely")
        }
    }

    private fun stopLocationUpdates() {
        try {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            socketManager.disconnect()
        } catch (e: Exception) {
            Log.e("LocationService", "Error stopping updates", e)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Orbit Partner • Online")
            .setContentText("Sharing live GPS location with client dispatch network")
            .setSmallIcon(R.drawable.orbit_logo)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Orbit Partner GPS Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows notification while partner is online and available for bookings"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        serviceScope.cancel()
    }
}
