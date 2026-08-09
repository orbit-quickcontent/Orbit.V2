package com.orbitlogic.partner.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager {
    private var socket: Socket? = null
    private val socketUrl = "http://10.0.2.2:3003" // Android Emulator mapping to orbit-ws port 3003

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
                extraHeaders = mapOf("Authorization" to listOf("Bearer $token"))
            }
            socket = IO.socket(socketUrl, options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "Partner Connected to Orbit Realtime WebSocket Server (port 3003)")
                setPartnerOnline(partnerId)
            }

            socket?.on("booking:dispatched") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    val bookingObj = data?.optJSONObject("booking")
                    val bookingId = bookingObj?.optString("id") ?: data?.optString("bookingId") ?: ""
                    val location = bookingObj?.optString("location") ?: "Client Location"
                    Log.d("SocketManager", "Partner dispatch received: $bookingId @ $location")
                    onNewDispatch(bookingId, location)
                }
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketManager", "Disconnected from WebSocket Server")
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e("SocketManager", "URL parsing exception", e)
        }
    }

    fun setPartnerOnline(partnerId: String) {
        val payload = JSONObject().apply {
            put("partnerId", partnerId)
        }
        socket?.emit("partner:online", payload)
    }

    /**
     * Push the partner's current GPS coordinates to the backend.
     *
     * Emits the `partner:updateLocation` event which the backend handles by:
     *  1. Updating the in-memory LocationService
     *  2. Persisting latitude/longitude/lastLocationAt to Firestore (fire-and-forget)
     *  3. Broadcasting `partner:location` to dashboard clients for live map updates
     *
     * @param partnerId  The partner's profile ID (used by backend to look up Firestore doc)
     * @param lat        Current GPS latitude
     * @param lng        Current GPS longitude
     * @param heading    Optional compass heading in degrees
     * @param speed      Optional speed in m/s
     */
    fun sendLocationUpdate(partnerId: String, lat: Double, lng: Double, heading: Double? = null, speed: Double? = null) {
        val payload = JSONObject().apply {
            put("partnerId", partnerId)
            put("lat", lat)
            put("lng", lng)
            heading?.let { put("heading", it) }
            speed?.let { put("speed", it) }
        }
        socket?.emit("partner:updateLocation", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
