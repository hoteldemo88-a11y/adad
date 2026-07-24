package com.childmonitor.app.data.repository

import com.childmonitor.app.data.local.CallLogDao
import com.childmonitor.app.data.local.ContactDao
import com.childmonitor.app.data.local.SmsDao
import com.childmonitor.app.data.remote.ApiService
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class DashboardResult<out T> {
    data class Success<T>(val data: T) : DashboardResult<T>()
    data class Error(val message: String) : DashboardResult<Nothing>()
}

@Singleton
class DashboardRepository @Inject constructor(
    private val apiService: ApiService,
    private val contactDao: ContactDao,
    private val callLogDao: CallLogDao,
    private val smsDao: SmsDao
) {

    fun getLocalContactCount(): Flow<Int> = contactDao.getContactCount()
    fun getLocalCallLogCount(): Flow<Int> = callLogDao.getCallLogCount()
    fun getLocalSmsCount(): Flow<Int> = smsDao.getSmsCount()

    suspend fun getLocalSyncCounts(): Triple<Int, Int, Int> {
        val contactCount = contactDao.getUnsyncedCount()
        val callCount = callLogDao.getUnsyncedCount()
        val smsCount = smsDao.getUnsyncedCount()
        return Triple(contactCount, callCount, smsCount)
    }
}
