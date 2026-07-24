package com.childmonitor.app.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.serialization.Serializable

@Entity(tableName = "pending_sync")
data class PendingSync(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val dataType: String,
    val recordId: Long,
    val operation: String,
    val payload: String,
    val retryCount: Int = 0,
    val maxRetries: Int = 3,
    val lastAttemptTimestamp: Long = 0L,
    val createdAt: Long = System.currentTimeMillis()
)
