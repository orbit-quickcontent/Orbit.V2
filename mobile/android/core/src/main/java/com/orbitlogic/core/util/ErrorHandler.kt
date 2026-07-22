package com.orbitlogic.core.util

import android.util.Log

object ErrorHandler {
    fun handleError(throwable: Throwable, tag: String = "OrbitError"): String {
        Log.e(tag, "An unexpected error occurred: ${throwable.localizedMessage}", throwable)
        return throwable.localizedMessage ?: "An unexpected network error occurred."
    }
}
