package com.orbitlogic.client.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager {
    private var socket: Socket? = null
    private val socketUrl = "http://10.0.2.2:3001" // Android Emulator localhost mapping

    fun connect(token: String, onBookingUpdate: (String, String) -> Unit) {
        if (socket?.connected() == true) return

        try {
            val options = IO.Options().apply {
                extraHeaders = mapOf("Authorization" to listOf("Bearer $token"))
            }
            socket = IO.socket(socketUrl, options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "Connected to WebSocket Server")
            }

            socket?.on("bookingUpdated") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as? JSONObject
                    val bookingId = data?.optString("id") ?: ""
                    val status = data?.optString("status") ?: ""
                    onBookingUpdate(bookingId, status)
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

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
