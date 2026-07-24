package com.childmonitor.app.service

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkRequest
import androidx.work.WorkerParameters
import com.childmonitor.app.data.local.PendingSyncDao
import com.childmonitor.app.data.model.PendingSync
import com.childmonitor.app.data.remote.TokenManager
import com.childmonitor.app.data.repository.CallLogRepository
import com.childmonitor.app.data.repository.ContactRepository
import com.childmonitor.app.data.repository.SmsRepository
import com.childmonitor.app.util.NetworkUtils
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.concurrent.TimeUnit

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted private val context: Context,
    @Assisted workerParams: WorkerParameters,
    private val contactRepository: ContactRepository,
    private val callLogRepository: CallLogRepository,
    private val smsRepository: SmsRepository,
    private val pendingSyncDao: PendingSyncDao,
    private val tokenManager: TokenManager
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SyncWorker"
        const val WORK_NAME = "child_monitor_sync"
        const val IMMEDIATE_SYNC_WORK = "immediate_sync"
        private const val MAX_PENDING_RETRIES = 50

        fun enqueuePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    androidx.work.BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .addTag("periodic_sync")
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }

        fun enqueueImmediateSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .addTag("immediate_sync")
                .build()

            WorkManager.getInstance(context).enqueue(syncRequest)
        }

        fun cancelAllSync(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting sync work...")

        if (!NetworkUtils.isNetworkAvailable(context)) {
            Log.w(TAG, "No network available, will retry when connected")
            return Result.retry()
        }

        val isPaired = tokenManager.isDevicePaired()
        if (!isPaired) {
            Log.e(TAG, "Device not paired, cannot sync")
            return Result.failure()
        }

        val deviceId = tokenManager.getDeviceId()
        if (deviceId.isNullOrEmpty()) {
            Log.e(TAG, "No device ID found, cannot sync")
            return Result.failure()
        }

        return try {
            var allSuccess = true

            Log.d(TAG, "Syncing contacts...")
            try {
                contactRepository.syncSystemContactsLocally()
                val contactResult = contactRepository.syncToServer(deviceId)
                if (contactResult is com.childmonitor.app.data.repository.SyncResult.Error) {
                    Log.e(TAG, "Contact sync error: ${contactResult.message}")
                    queueFailedSync("contacts", contactResult.message)
                    allSuccess = false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Contact sync failed", e)
                allSuccess = false
            }

            Log.d(TAG, "Syncing call logs...")
            try {
                callLogRepository.syncSystemCallLogsLocally()
                val callResult = callLogRepository.syncToServer(deviceId)
                if (callResult is com.childmonitor.app.data.repository.SyncResult.Error) {
                    Log.e(TAG, "Call log sync error: ${callResult.message}")
                    queueFailedSync("calls", callResult.message)
                    allSuccess = false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Call log sync failed", e)
                allSuccess = false
            }

            Log.d(TAG, "Syncing SMS...")
            try {
                smsRepository.syncSystemSmsLocally()
                val smsResult = smsRepository.syncToServer(deviceId)
                if (smsResult is com.childmonitor.app.data.repository.SyncResult.Error) {
                    Log.e(TAG, "SMS sync error: ${smsResult.message}")
                    queueFailedSync("sms", smsResult.message)
                    allSuccess = false
                }
            } catch (e: Exception) {
                Log.e(TAG, "SMS sync failed", e)
                allSuccess = false
            }

            Log.d(TAG, "Processing pending retry queue...")
            processPendingQueue(deviceId)

            tokenManager.updateLastSyncTime()

            if (allSuccess) {
                Log.d(TAG, "Sync completed successfully")
                Result.success()
            } else {
                Log.w(TAG, "Sync completed with some errors")
                Result.success()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Sync work failed", e)
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    private suspend fun queueFailedSync(dataType: String, errorMessage: String) {
        try {
            val pending = PendingSync(
                dataType = dataType,
                recordId = 0,
                operation = "sync",
                payload = Json.encodeToString(mapOf("error" to errorMessage)),
                retryCount = 0
            )
            pendingSyncDao.insert(pending)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to queue pending sync", e)
        }
    }

    private suspend fun processPendingQueue(deviceId: String) {
        val pendingItems = pendingSyncDao.getRetryablePending(MAX_PENDING_RETRIES)
        if (pendingItems.isEmpty()) return

        val groupedByType = pendingItems.groupBy { it.dataType }

        for ((dataType, items) in groupedByType) {
            try {
                when (dataType) {
                    "contacts" -> {
                        val result = contactRepository.syncToServer(deviceId)
                        if (result is com.childmonitor.app.data.repository.SyncResult.Success) {
                            pendingSyncDao.deleteByIds(items.map { it.id })
                        } else {
                            items.forEach { pendingSyncDao.incrementRetry(it.id) }
                        }
                    }
                    "calls" -> {
                        val result = callLogRepository.syncToServer(deviceId)
                        if (result is com.childmonitor.app.data.repository.SyncResult.Success) {
                            pendingSyncDao.deleteByIds(items.map { it.id })
                        } else {
                            items.forEach { pendingSyncDao.incrementRetry(it.id) }
                        }
                    }
                    "sms" -> {
                        val result = smsRepository.syncToServer(deviceId)
                        if (result is com.childmonitor.app.data.repository.SyncResult.Success) {
                            pendingSyncDao.deleteByIds(items.map { it.id })
                        } else {
                            items.forEach { pendingSyncDao.incrementRetry(it.id) }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to process pending $dataType sync", e)
                items.forEach { pendingSyncDao.incrementRetry(it.id) }
            }
        }

        pendingSyncDao.deleteExhausted()
    }
}
