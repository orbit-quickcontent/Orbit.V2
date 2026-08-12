package com.orbitlogic.client.data

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Android Client Unified Orbit Hub Service
 * Connects Android Client App directly to Firebase Firestore collections ('users', 'bookings', 'partner_locations')
 */
class UnifiedOrbitHub {

    private val db: FirebaseFirestore
        get() = FirebaseFirestore.getInstance()

    suspend fun syncUserProfile(
        userId: String,
        email: String,
        name: String,
        phone: String = "",
        persona: String = "Creator",
        role: String = "CLIENT"
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val userMap = hashMapOf(
                "id" to userId,
                "uid" to userId,
                "email" to email,
                "name" to name,
                "full_name" to name,
                "phone" to phone,
                "persona" to persona,
                "role" to role,
                "isOnline" to true,
                "updatedAt" to com.google.firebase.Timestamp.now()
            )
            db.collection("users").document(userId).set(userMap, SetOptions.merge())
            true
        } catch (e: Exception) {
            android.util.Log.e("UnifiedOrbitHub", "Error syncing user profile", e)
            false
        }
    }

    suspend fun createBooking(
        bookingId: String,
        clientId: String,
        clientName: String,
        packageName: String,
        amount: Double,
        date: String,
        time: String,
        location: String,
        notes: String = ""
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val bookingMap = hashMapOf(
                "id" to bookingId,
                "clientId" to clientId,
                "clientName" to clientName,
                "packageName" to packageName,
                "amount" to amount,
                "status" to "PENDING",
                "date" to date,
                "time" to time,
                "location" to location,
                "notes" to notes,
                "createdAt" to com.google.firebase.Timestamp.now(),
                "updatedAt" to com.google.firebase.Timestamp.now()
            )
            db.collection("bookings").document(bookingId).set(bookingMap, SetOptions.merge())
            true
        } catch (e: Exception) {
            android.util.Log.e("UnifiedOrbitHub", "Error creating booking", e)
            false
        }
    }

    suspend fun listenToBookingUpdates(
        bookingId: String,
        onUpdate: (String, String?) -> Unit
    ) = withContext(Dispatchers.Main) {
        db.collection("bookings").document(bookingId).addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) return@addSnapshotListener
            val status = snapshot.getString("status") ?: "PENDING"
            val partnerName = snapshot.getString("partnerName")
            onUpdate(status, partnerName)
        }
    }
}
