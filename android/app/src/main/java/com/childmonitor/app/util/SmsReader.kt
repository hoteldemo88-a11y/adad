package com.childmonitor.app.util

import android.content.Context
import android.provider.Telephony
import android.util.Log

data class SystemSms(
    val systemSmsId: Long,
    val phoneNumber: String,
    val contactName: String?,
    val body: String,
    val type: String,
    val timestamp: Long
)

object SmsReader {
    private const val TAG = "SmsReader"

    fun readSms(context: Context, limit: Int = 500): List<SystemSms> {
        val messages = mutableListOf<SystemSms>()

        try {
            val projection = arrayOf(
                Telephony.Sms._ID,
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.TYPE,
                Telephony.Sms.DATE,
                Telephony.Sms.PERSON
            )

            val sortOrder = "${Telephony.Sms.DATE} DESC"

            context.contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                projection,
                null,
                null,
                sortOrder
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndex(Telephony.Sms._ID)
                val addressIndex = cursor.getColumnIndex(Telephony.Sms.ADDRESS)
                val bodyIndex = cursor.getColumnIndex(Telephony.Sms.BODY)
                val typeIndex = cursor.getColumnIndex(Telephony.Sms.TYPE)
                val dateIndex = cursor.getColumnIndex(Telephony.Sms.DATE)

                var count = 0
                while (cursor.moveToNext() && count < limit) {
                    val id = cursor.getLong(idIndex)
                    val address = cursor.getString(addressIndex) ?: ""
                    val body = cursor.getString(bodyIndex) ?: ""
                    val type = when (cursor.getInt(typeIndex)) {
                        Telephony.Sms.MESSAGE_TYPE_INBOX -> "inbox"
                        Telephony.Sms.MESSAGE_TYPE_SENT -> "sent"
                        Telephony.Sms.MESSAGE_TYPE_DRAFT -> "draft"
                        Telephony.Sms.MESSAGE_TYPE_OUTBOX -> "outbox"
                        Telephony.Sms.MESSAGE_TYPE_FAILED -> "failed"
                        Telephony.Sms.MESSAGE_TYPE_QUEUED -> "queued"
                        else -> "unknown"
                    }
                    val date = cursor.getLong(dateIndex)

                    val contactName = getContactNameFromNumber(context, address)

                    messages.add(
                        SystemSms(
                            systemSmsId = id,
                            phoneNumber = address,
                            contactName = contactName,
                            body = body,
                            type = type,
                            timestamp = date
                        )
                    )
                    count++
                }
            }

            Log.d(TAG, "Read ${messages.size} SMS messages from system")
        } catch (e: Exception) {
            Log.e(TAG, "Error reading SMS", e)
        }

        return messages
    }

    private fun getContactNameFromNumber(context: Context, number: String): String? {
        if (number.isBlank()) return null
        return try {
            val uri = android.net.Uri.withAppendedPath(
                android.provider.ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                android.net.Uri.encode(number)
            )
            context.contentResolver.query(
                uri,
                arrayOf(android.provider.ContactsContract.PhoneLookup.DISPLAY_NAME),
                null,
                null,
                null
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    cursor.getString(0)
                } else {
                    null
                }
            }
        } catch (e: Exception) {
            null
        }
    }
}
