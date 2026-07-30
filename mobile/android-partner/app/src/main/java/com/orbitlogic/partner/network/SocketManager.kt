package com.orbitlogic.partner.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager {
    private var socket: Socket? = null
    private val socketUrl = "http://10.0.2.2:3003" // Android Emulator mapping to orbit-ws port 3003

    fun connect(partnerId: String = "prt-arjun", token: String = "partner_token", onNewDispatch: (String, String) -> Unit) {
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

    fun sendLocationUpdate(lat: Double, lng: Double, bookingId: String) {
        val payload = JSONObject().apply {
            put("latitude", lat)
            put("longitude", lng)
            put("bookingId", bookingId)
        }
        socket?.emit("partner:location", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
