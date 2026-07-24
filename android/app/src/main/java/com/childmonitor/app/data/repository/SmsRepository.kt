package com.childmonitor.app.data.repository

import android.content.Context
import com.childmonitor.app.data.local.SmsDao
import com.childmonitor.app.data.model.SmsMessage
import com.childmonitor.app.data.model.SmsSyncItem
import com.childmonitor.app.data.model.SmsSyncRequest
import com.childmonitor.app.data.remote.ApiService
import com.childmonitor.app.util.SmsReader
import com.childmonitor.app.util.SyncHashUtil
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SmsRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val smsDao: SmsDao,
    private val apiService: ApiService
) {

    fun getAllSms(): Flow<List<SmsMessage>> = smsDao.getAllSms()

    fun getSmsCount(): Flow<Int> = smsDao.getSmsCount()

    suspend fun getUnsyncedCount(): Int = smsDao.getUnsyncedCount()

    suspend fun readSystemSms(): List<SmsMessage> {
        val systemSms = SmsReader.readSms(context)
        return systemSms.map { sms ->
            val syncHash = SyncHashUtil.computeSmsHash(
                phoneNumber = sms.phoneNumber,
                body = sms.body,
                type = sms.type,
                timestamp = sms.timestamp
            )

            val existing = smsDao.findByHashAndSystemId(syncHash, sms.systemSmsId)
            if (existing != null) {
                existing
            } else {
                val existingBySystemId = smsDao.getBySystemId(sms.systemSmsId)
                if (existingBySystemId != null) {
                    existingBySystemId.copy(
                        senderNumber = sms.phoneNumber,
                        recipientNumber = "",
                        body = sms.body,
                        type = sms.type,
                        timestamp = sms.timestamp,
                        syncHash = syncHash,
                        syncedToServer = false
                    )
                } else {
                    SmsMessage(
                        systemSmsId = sms.systemSmsId,
                        senderNumber = sms.phoneNumber,
                        recipientNumber = "",
                        body = sms.body,
                        type = sms.type,
                        timestamp = sms.timestamp,
                        syncHash = syncHash,
                        syncedToServer = false
                    )
                }
            }
        }
    }

    suspend fun syncSystemSmsLocally() {
        val smsMessages = readSystemSms()
        smsDao.insertAll(smsMessages)
    }

    suspend fun syncToServer(deviceId: String): SyncResult {
        return try {
            val unsyncedSms = smsDao.getUnsyncedSms()
            if (unsyncedSms.isEmpty()) {
                return SyncResult.Success
            }

            val syncItems = unsyncedSms.map { sms ->
                SmsSyncItem(
                    systemSmsId = sms.systemSmsId,
                    senderNumber = sms.senderNumber,
                    recipientNumber = sms.recipientNumber,
                    body = sms.body,
                    type = sms.type,
                    timestamp = sms.timestamp,
                    syncHash = sms.syncHash
                )
            }

            val request = SmsSyncRequest(
                deviceId = deviceId,
                messages = syncItems
            )

            val response = apiService.syncSms(request)
            if (response.success) {
                val syncedIds = unsyncedSms.map { it.id }
                smsDao.markAsSynced(syncedIds)
                SyncResult.Success
            } else {
                SyncResult.Error(response.message)
            }
        } catch (e: Exception) {
            SyncResult.Error(e.message ?: "SMS sync failed")
        }
    }

    suspend fun fullSync(deviceId: String): SyncResult {
        syncSystemSmsLocally()
        return syncToServer(deviceId)
    }

    suspend fun deleteAll() {
        smsDao.deleteAll()
    }
}
