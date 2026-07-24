package com.childmonitor.app.util

import android.content.Context
import android.provider.CallLog
import android.util.Log

data class SystemCallLog(
    val systemCallId: Long,
    val phoneNumber: String,
    val contactName: String?,
    val callType: String,
    val duration: Long,
    val timestamp: Long
)

object CallLogReader {
    private const val TAG = "CallLogReader"

    fun readCallLogs(context: Context, limit: Int = 500): List<SystemCallLog> {
        val callLogs = mutableListOf<SystemCallLog>()

        try {
            val projection = arrayOf(
                CallLog.Calls._ID,
                CallLog.Calls.NUMBER,
                CallLog.Calls.CACHED_NAME,
                CallLog.Calls.TYPE,
                CallLog.Calls.DURATION,
                CallLog.Calls.DATE
            )

            val sortOrder = "${CallLog.Calls.DATE} DESC"

            context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndex(CallLog.Calls._ID)
                val numberIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER)
                val nameIndex = cursor.getColumnIndex(CallLog.Calls.CACHED_NAME)
                val typeIndex = cursor.getColumnIndex(CallLog.Calls.TYPE)
                val durationIndex = cursor.getColumnIndex(CallLog.Calls.DURATION)
                val dateIndex = cursor.getColumnIndex(CallLog.Calls.DATE)

                var count = 0
                while (cursor.moveToNext() && count < limit) {
                    val id = cursor.getLong(idIndex)
                    val number = cursor.getString(numberIndex) ?: ""
                    val name = cursor.getString(nameIndex)
                    val type = when (cursor.getInt(typeIndex)) {
                        CallLog.Calls.INCOMING_TYPE -> "incoming"
                        CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                        CallLog.Calls.MISSED_TYPE -> "missed"
                        CallLog.Calls.REJECTED_TYPE -> "rejected"
                        CallLog.Calls.BLOCKED_TYPE -> "blocked"
                        CallLog.Calls.VOICEMAIL_TYPE -> "voicemail"
                        else -> "unknown"
                    }
                    val duration = cursor.getLong(durationIndex)
                    val date = cursor.getLong(dateIndex)

                    callLogs.add(
                        SystemCallLog(
                            systemCallId = id,
                            phoneNumber = number,
                            contactName = name,
                            callType = type,
                            duration = duration,
                            timestamp = date
                        )
                    )
                    count++
                }
            }

            Log.d(TAG, "Read ${callLogs.size} call logs from system")
        } catch (e: Exception) {
            Log.e(TAG, "Error reading call logs", e)
        }

        return callLogs
    }

    fun getCallTypeString(type: Int): String {
        return when (type) {
            CallLog.Calls.INCOMING_TYPE -> "incoming"
            CallLog.Calls.OUTGOING_TYPE -> "outgoing"
            CallLog.Calls.MISSED_TYPE -> "missed"
            CallLog.Calls.REJECTED_TYPE -> "rejected"
            CallLog.Calls.BLOCKED_TYPE -> "blocked"
            else -> "unknown"
        }
    }
}
