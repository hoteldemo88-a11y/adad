package com.childmonitor.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.childmonitor.app.data.model.CallLog
import kotlinx.coroutines.flow.Flow

@Dao
interface CallLogDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(callLog: CallLog): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(callLogs: List<CallLog>)

    @Update
    suspend fun update(callLog: CallLog)

    @Query("UPDATE call_logs SET syncedToServer = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)

    @Query("UPDATE call_logs SET syncedToServer = 0")
    suspend fun markAllAsUnsynced()

    @Query("SELECT * FROM call_logs ORDER BY timestamp DESC")
    fun getAllCallLogs(): Flow<List<CallLog>>

    @Query("SELECT * FROM call_logs WHERE id = :id")
    suspend fun getById(id: Long): CallLog?

    @Query("SELECT * FROM call_logs WHERE systemCallId = :systemId")
    suspend fun getBySystemId(systemId: Long): CallLog?

    @Query("SELECT * FROM call_logs WHERE callType = :type ORDER BY timestamp DESC")
    fun getByType(type: String): Flow<List<CallLog>>

    @Query("SELECT * FROM call_logs WHERE syncedToServer = 0 ORDER BY timestamp DESC")
    suspend fun getUnsyncedCallLogs(): List<CallLog>

    @Query("SELECT * FROM call_logs WHERE syncHash = :hash AND systemCallId = :systemId")
    suspend fun findByHashAndSystemId(hash: String, systemId: Long): CallLog?

    @Query("SELECT * FROM call_logs ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentCallLogs(limit: Int): Flow<List<CallLog>>

    @Query("SELECT COUNT(*) FROM call_logs")
    fun getCallLogCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM call_logs WHERE syncedToServer = 0")
    suspend fun getUnsyncedCount(): Int

    @Query("DELETE FROM call_logs")
    suspend fun deleteAll()

    @Query("DELETE FROM call_logs WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<Long>)
}
