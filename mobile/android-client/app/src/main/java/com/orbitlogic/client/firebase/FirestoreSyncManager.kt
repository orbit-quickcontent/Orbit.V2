package com.orbitlogic.client.firebase

import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration

class FirestoreSyncManager {
    private var listenerRegistration: ListenerRegistration? = null

    fun startSyncingBooking(bookingId: String, onUpdate: (String, Int) -> Unit) {
        // Remove any existing listener before starting a new one
        stopSyncing()

        Log.d("FirestoreSyncManager", "Subscribing to Firestore updates for booking $bookingId")

        listenerRegistration = FirebaseFirestore.getInstance()
            .collection("bookings")
            .document(bookingId)
            .addSnapshotListener { snapshot, e ->
                if (e != null) {
                    Log.e("FirestoreSyncManager", "Firestore listener error for booking $bookingId", e)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    val status = snapshot.getString("status") ?: ""
                    val syncPercentage = snapshot.getLong("syncPercentage")?.toInt() ?: 0
                    Log.d("FirestoreSyncManager", "Booking $bookingId update: status=$status, sync=$syncPercentage%")
                    onUpdate(status, syncPercentage)
                }
            }
    }

    fun stopSyncing() {
        listenerRegistration?.remove()
        listenerRegistration = null
        Log.d("FirestoreSyncManager", "Stopped syncing booking updates")
    }
}
