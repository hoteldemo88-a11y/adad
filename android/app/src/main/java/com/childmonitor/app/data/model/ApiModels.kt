package com.childmonitor.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class AutoRegisterRequest(
    val deviceName: String,
    val deviceModel: String,
    val manufacturer: String,
    val androidVersion: String
)

@Serializable
data class AutoRegisterResponse(
    val deviceId: String,
    val deviceToken: String,
    val status: String
)

@Serializable
data class DevicePairRequest(
    val pairingCode: String,
    val deviceName: String,
    val deviceModel: String,
    val androidVersion: String,
    val manufacturer: String = android.os.Build.MANUFACTURER
)

@Serializable
data class DevicePairResponse(
    val success: Boolean,
    val deviceId: String,
    val deviceToken: String,
    val parentId: String,
    val message: String
)

@Serializable
data class ContactSyncRequest(
    val deviceId: String,
    val contacts: List<ContactSyncItem>
)

@Serializable
data class ContactSyncItem(
    val systemContactId: Long,
    val displayName: String,
    val phoneNumber: String,
    val email: String = "",
    val isFavorite: Boolean = false,
    val syncHash: String
)

@Serializable
data class CallLogSyncRequest(
    val deviceId: String,
    val calls: List<CallLogSyncItem>
)

@Serializable
data class CallLogSyncItem(
    val systemCallId: Long,
    val phoneNumber: String,
    val contactName: String?,
    val callType: String,
    val duration: Long,
    val timestamp: Long,
    val syncHash: String
)

@Serializable
data class SmsSyncRequest(
    val deviceId: String,
    val messages: List<SmsSyncItem>
)

@Serializable
data class SmsSyncItem(
    val systemSmsId: Long,
    val senderNumber: String,
    val recipientNumber: String,
    val body: String,
    val type: String,
    val timestamp: Long,
    val syncHash: String
)

@Serializable
data class SyncResponse(
    val success: Boolean,
    val syncedCount: Int,
    val message: String
)

@Serializable
data class DashboardResponse(
    val success: Boolean,
    val isOnline: Boolean = true,
    val batteryLevel: Int = 0,
    val lastSyncTime: Long = 0L,
    val storageTotal: Long = 0,
    val storageUsed: Long = 0,
    val totalContacts: Int = 0,
    val totalCalls: Int = 0,
    val totalSms: Int = 0,
    val isMonitoringActive: Boolean = true,
    val message: String = ""
)

@Serializable
data class MonitoringToggleRequest(
    val deviceId: String,
    val active: Boolean
)

@Serializable
data class MonitoringToggleResponse(
    val success: Boolean,
    val monitoringActive: Boolean,
    val message: String
)

@Serializable
data class ApiResponse(
    val success: Boolean,
    val message: String
)
