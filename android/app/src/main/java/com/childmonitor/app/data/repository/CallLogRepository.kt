package com.childmonitor.app.data.repository

import android.content.Context
import com.childmonitor.app.data.local.CallLogDao
import com.childmonitor.app.data.model.CallLog
import com.childmonitor.app.data.model.CallLogSyncItem
import com.childmonitor.app.data.model.CallLogSyncRequest
import com.childmonitor.app.data.remote.ApiService
import com.childmonitor.app.util.CallLogReader
import com.childmonitor.app.util.SyncHashUtil
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CallLogRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val callLogDao: CallLogDao,
    private val apiService: ApiService
) {

    fun getAllCallLogs(): Flow<List<CallLog>> = callLogDao.getAllCallLogs()

    fun getCallLogCount(): Flow<Int> = callLogDao.getCallLogCount()

    suspend fun getUnsyncedCount(): Int = callLogDao.getUnsyncedCount()

    suspend fun readSystemCallLogs(): List<CallLog> {
        val systemCalls = CallLogReader.readCallLogs(context)
        return systemCalls.map { systemCall ->
            val syncHash = SyncHashUtil.computeCallLogHash(
                phoneNumber = systemCall.phoneNumber,
                callType = systemCall.callType,
                duration = systemCall.duration,
                timestamp = systemCall.timestamp
            )

            val existing = callLogDao.findByHashAndSystemId(syncHash, systemCall.systemCallId)
            if (existing != null) {
                existing
            } else {
                val existingBySystemId = callLogDao.getBySystemId(systemCall.systemCallId)
                if (existingBySystemId != null) {
                    existingBySystemId.copy(
                        phoneNumber = systemCall.phoneNumber,
                        contactName = systemCall.contactName,
                        callType = systemCall.callType,
                        duration = systemCall.duration,
                        timestamp = systemCall.timestamp,
                        syncHash = syncHash,
                        syncedToServer = false
                    )
                } else {
                    CallLog(
                        systemCallId = systemCall.systemCallId,
                        phoneNumber = systemCall.phoneNumber,
                        contactName = systemCall.contactName,
                        callType = systemCall.callType,
                        duration = systemCall.duration,
                        timestamp = systemCall.timestamp,
                        syncHash = syncHash,
                        syncedToServer = false
                    )
                }
            }
        }
    }

    suspend fun syncSystemCallLogsLocally() {
        val callLogs = readSystemCallLogs()
        callLogDao.insertAll(callLogs)
    }

    suspend fun syncToServer(deviceId: String): SyncResult {
        return try {
            val unsyncedCalls = callLogDao.getUnsyncedCallLogs()
            if (unsyncedCalls.isEmpty()) {
                return SyncResult.Success
            }

            val syncItems = unsyncedCalls.map { call ->
                CallLogSyncItem(
                    systemCallId = call.systemCallId,
                    phoneNumber = call.phoneNumber,
                    contactName = call.contactName,
                    callType = call.callType,
                    duration = call.duration,
                    timestamp = call.timestamp,
                    syncHash = call.syncHash
                )
            }

            val request = CallLogSyncRequest(
                deviceId = deviceId,
                calls = syncItems
            )

            val response = apiService.syncCalls(request)
            if (response.success) {
                val syncedIds = unsyncedCalls.map { it.id }
                callLogDao.markAsSynced(syncedIds)
                SyncResult.Success
            } else {
                SyncResult.Error(response.message)
            }
        } catch (e: Exception) {
            SyncResult.Error(e.message ?: "Call log sync failed")
        }
    }

    suspend fun fullSync(deviceId: String): SyncResult {
        syncSystemCallLogsLocally()
        return syncToServer(deviceId)
    }

    suspend fun deleteAll() {
        callLogDao.deleteAll()
    }
}
