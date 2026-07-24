package com.childmonitor.app.data.model

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "contacts",
    indices = [
        Index(value = ["systemContactId"], unique = true),
        Index(value = ["syncHash"]),
        Index(value = ["syncedToServer"])
    ]
)
data class Contact(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val systemContactId: Long,
    val displayName: String,
    val phoneNumber: String,
    val email: String = "",
    val photoUri: String? = null,
    val isFavorite: Boolean = false,
    val syncHash: String,
    val syncedToServer: Boolean = false,
    val lastModifiedTimestamp: Long = System.currentTimeMillis()
)
