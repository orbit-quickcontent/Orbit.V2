package com.orbitlogic.client.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager {
    private var socket: Socket? = null
    private val socketUrl = "https://orbit-v2-mnmc-one.vercel.app"

    fun connect(token: String, bookingId: String? = null, onBookingUpdate: (String, String) -> Unit) {
        if (socket?.connected() == true) {
            if (!bookingId.isNullOrBlank()) {
                subscribeToBooking(bookingId)
            }
            return
        }

        try {
            val options = IO.Options().apply {
                extraHeaders = mapOf("Authorization" to listOf("Bearer $token"))
            }
            socket = IO.socket(socketUrl, options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "Connected to Orbit Realtime WebSocket Server (port 3003)")
                if (!bookingId.isNullOrBlank()) {
                    subscribeToBooking(bookingId)
                }
            }

            socket?.on("booking:status-update") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    val bId = data?.optString("bookingId") ?: ""
                    val status = data?.optString("status") ?: ""
                    Log.d("SocketManager", "Booking status update received: $bId -> $status")
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

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketManager", "Disconnected from WebSocket Server")
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e("SocketManager", "URL parsing exception", e)
        }
    }

    fun subscribeToBooking(bookingId: String) {
        val payload = JSONObject().apply {
            put("bookingId", bookingId)
        }
        socket?.emit("client:subscribe", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
