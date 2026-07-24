package com.childmonitor.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.childmonitor.app.data.model.PendingSync

@Dao
interface PendingSyncDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(pendingSync: PendingSync): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(pendingSyncs: List<PendingSync>)

    @Update
    suspend fun update(pendingSync: PendingSync)

    @Query("SELECT * FROM pending_sync ORDER BY createdAt ASC")
    suspend fun getAllPending(): List<PendingSync>

    @Query("SELECT * FROM pending_sync WHERE dataType = :dataType ORDER BY createdAt ASC")
    suspend fun getByDataType(dataType: String): List<PendingSync>

    @Query("SELECT * FROM pending_sync WHERE retryCount < maxRetries ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getRetryablePending(limit: Int = 50): List<PendingSync>

    @Query("SELECT * FROM pending_sync WHERE id = :id")
    suspend fun getById(id: Long): PendingSync?

    @Query("UPDATE pending_sync SET retryCount = retryCount + 1, lastAttemptTimestamp = :timestamp WHERE id = :id")
    suspend fun incrementRetry(id: Long, timestamp: Long = System.currentTimeMillis())

    @Query("DELETE FROM pending_sync WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM pending_sync WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<Long>)

    @Query("DELETE FROM pending_sync WHERE retryCount >= maxRetries")
    suspend fun deleteExhausted()

    @Query("SELECT COUNT(*) FROM pending_sync")
    suspend fun getPendingCount(): Int

    @Query("DELETE FROM pending_sync")
    suspend fun deleteAll()
}
