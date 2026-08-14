package com.orbitlogic.client.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager {
    private var socket: Socket? = null
    private val socketUrl = "https://orbit-v2-mnmc-one.vercel.app"

    fun connect(
        token: String,
        bookingId: String? = null,
        onBookingUpdate: (String, String) -> Unit = { _, _ -> },
        onPartnerLocationUpdate: ((String, Double, Double) -> Unit)? = null
    ) {
        if (socket?.connected() == true) {
            if (!bookingId.isNullOrBlank()) {
                subscribeToBooking(bookingId)
            }
            return
        }

        try {
            val options = IO.Options().apply {
                auth = mapOf("token" to token)
                extraHeaders = mapOf("Authorization" to listOf("Bearer $token"))
                reconnection = true
                reconnectionAttempts = 15
                reconnectionDelay = 2000
            }
            socket = IO.socket(socketUrl, options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "Client connected to Orbit Realtime Server")
                if (!bookingId.isNullOrBlank()) {
                    subscribeToBooking(bookingId)
                }
            }

            socket?.on("booking:status-update") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    val bId = data?.optString("bookingId") ?: ""
                    val status = data?.optString("status") ?: ""
                    Log.d("SocketManager", "Booking status update: $bId -> $status")
                    onBookingUpdate(bId, status)
                }
            }

            socket?.on("booking:partner-assigned") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    val bId = data?.optString("bookingId") ?: ""
                    Log.d("SocketManager", "Partner assigned for booking: $bId")
                    onBookingUpdate(bId, "ACCEPTED")
                }
            }

            // Real-time Partner Location Updates (Redis GEO event & legacy event)
            socket?.on("partner_location_update") { args ->
                handlePartnerLocationEvent(args, onPartnerLocationUpdate)
            }

            socket?.on("partner:location") { args ->
                handlePartnerLocationEvent(args, onPartnerLocationUpdate)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketManager", "Disconnected from WebSocket Server")
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e("SocketManager", "URL parsing exception", e)
        }
    }

    private fun handlePartnerLocationEvent(args: Array<Any>, callback: ((String, Double, Double) -> Unit)?) {
        if (args.isNotEmpty() && callback != null) {
            val data = args[0] as? JSONObject
            val partnerId = data?.optString("partnerId") ?: ""
            val lat = data?.optDouble("lat", Double.NaN) ?: Double.NaN
            val lng = data?.optDouble("lng", Double.NaN) ?: Double.NaN

            if (!lat.isNaN() && !lng.isNaN()) {
                callback(partnerId, lat, lng)
            }
        }
    }

    fun subscribeToBooking(bookingId: String) {
        val payload = JSONObject().apply {
            put("bookingId", bookingId)
        }
        socket?.emit("client:subscribe", payload)
        socket?.emit("join_booking", bookingId)
    }

    fun trackPartner(partnerId: String) {
        if (partnerId.isNotBlank()) {
            socket?.emit("track_partner", partnerId)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
