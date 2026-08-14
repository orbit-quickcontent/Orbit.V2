package com.orbitlogic.partner.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager {
    private var socket: Socket? = null
    // Supports primary backend with fallback to localhost/emulator for local dispatch service
    private val socketUrl = "https://orbit-v2-mnmc-one.vercel.app"
    private var lastLocationTimestamp: Long = 0

    fun connect(partnerId: String, token: String, onNewDispatch: (String, String) -> Unit) {
        if (partnerId.isBlank() || token.isBlank()) {
            Log.e("SocketManager", "Partner ID or token is missing; cannot connect socket.")
            return
        }
        if (socket?.connected() == true) {
            setPartnerOnline(partnerId)
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
                Log.d("SocketManager", "Partner Connected to Orbit Realtime WebSocket Server")
                setPartnerOnline(partnerId)
            }

            socket?.on("booking:dispatched") { args ->
                handleDispatchEvent(args, onNewDispatch)
            }

            socket?.on("booking:offer") { args ->
                handleDispatchEvent(args, onNewDispatch)
            }

            socket?.on("booking_request") { args ->
                handleDispatchEvent(args, onNewDispatch)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketManager", "Disconnected from WebSocket Server")
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e("SocketManager", "URL parsing exception", e)
        }
    }

    private fun handleDispatchEvent(args: Array<Any>, onNewDispatch: (String, String) -> Unit) {
        if (args.isNotEmpty()) {
            val data = args[0] as? JSONObject
            val bookingObj = data?.optJSONObject("booking")
            val bookingId = bookingObj?.optString("id") ?: data?.optString("bookingId") ?: ""
            val location = bookingObj?.optString("location") ?: "Client Shoot Location"
            Log.d("SocketManager", "Partner dispatch received: $bookingId @ $location")
            onNewDispatch(bookingId, location)
        }
    }

    fun setPartnerOnline(partnerId: String) {
        val payload = JSONObject().apply {
            put("partnerId", partnerId)
        }
        socket?.emit("partner:online", payload)
    }

    /**
     * Push the partner's current GPS coordinates to the backend with rate limiting.
     * Emits `partner_location` (Redis GEO format) and `partner:updateLocation`.
     */
    fun sendLocationUpdate(partnerId: String, lat: Double, lng: Double, heading: Double? = null, speed: Double? = null) {
        val now = System.currentTimeMillis()
        if (now - lastLocationTimestamp < 2500) {
            return // Throttled to max 1 update per 2.5-3 seconds
        }
        lastLocationTimestamp = now

        val payload = JSONObject().apply {
            put("partnerId", partnerId)
            put("lat", lat)
            put("lng", lng)
            heading?.let { put("heading", it) }
            speed?.let { put("speed", it) }
            put("timestamp", now)
        }

        // Emit Redis GEO format
        socket?.emit("partner_location", payload)
        // Emit Vercel legacy format
        socket?.emit("partner:updateLocation", payload)
    }

    fun joinBooking(bookingId: String) {
        if (bookingId.isNotBlank()) {
            socket?.emit("join_booking", bookingId)
        }
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
