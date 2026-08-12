package com.orbitlogic.client.firebase

import android.util.Log
import com.orbitlogic.client.network.SocketManager

/**
 * Real-time Booking Sync Manager using Orbit Socket & Supabase Backend
 */
class FirestoreSyncManager {
    private var socketManager: SocketManager? = null

    fun startSyncingBooking(bookingId: String, onUpdate: (String, Int) -> Unit) {
        stopSyncing()
        Log.d("SyncManager", "Subscribing to real-time updates for booking $bookingId")

        socketManager = SocketManager().apply {
            connect("token_placeholder", bookingId) { bId, status ->
                if (bId == bookingId || bId.isBlank()) {
                    onUpdate(status, 100)
                }
            }
        }
    }

    fun stopSyncing() {
        socketManager?.disconnect()
        socketManager = null
        Log.d("SyncManager", "Stopped syncing booking updates")
    }
}
