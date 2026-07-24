package com.childmonitor.app.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "call_logs",
    indices = [
        Index(value = ["systemCallId"], unique = true),
        Index(value = ["syncHash"]),
        Index(value = ["syncedToServer"])
    ]
)
data class CallLog(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val systemCallId: Long,
    val phoneNumber: String,
    val contactName: String? = null,
    val callType: String,
    val duration: Long,
    val timestamp: Long,
    val syncHash: String,
    val syncedToServer: Boolean = false
)
