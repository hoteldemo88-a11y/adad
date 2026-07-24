package com.childmonitor.app.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sms_messages",
    indices = [
        Index(value = ["systemSmsId"], unique = true),
        Index(value = ["syncHash"]),
        Index(value = ["syncedToServer"])
    ]
)
data class SmsMessage(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val systemSmsId: Long,
    val senderNumber: String,
    val recipientNumber: String,
    val body: String,
    val type: String,
    val timestamp: Long,
    val syncHash: String,
    val syncedToServer: Boolean = false
)
