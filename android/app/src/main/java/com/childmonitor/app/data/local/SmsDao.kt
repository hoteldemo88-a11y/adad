package com.childmonitor.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.childmonitor.app.data.model.SmsMessage
import kotlinx.coroutines.flow.Flow

@Dao
interface SmsDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(sms: SmsMessage): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(messages: List<SmsMessage>)

    @Update
    suspend fun update(sms: SmsMessage)

    @Query("UPDATE sms_messages SET syncedToServer = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)

    @Query("UPDATE sms_messages SET syncedToServer = 0")
    suspend fun markAllAsUnsynced()

    @Query("SELECT * FROM sms_messages ORDER BY timestamp DESC")
    fun getAllSms(): Flow<List<SmsMessage>>

    @Query("SELECT * FROM sms_messages WHERE id = :id")
    suspend fun getById(id: Long): SmsMessage?

    @Query("SELECT * FROM sms_messages WHERE systemSmsId = :systemId")
    suspend fun getBySystemId(systemId: Long): SmsMessage?

    @Query("SELECT * FROM sms_messages WHERE senderNumber = :number OR recipientNumber = :number ORDER BY timestamp DESC")
    fun getByPhoneNumber(number: String): Flow<List<SmsMessage>>

    @Query("SELECT * FROM sms_messages WHERE type = :type ORDER BY timestamp DESC")
    fun getByType(type: String): Flow<List<SmsMessage>>

    @Query("SELECT * FROM sms_messages WHERE syncedToServer = 0 ORDER BY timestamp DESC")
    suspend fun getUnsyncedSms(): List<SmsMessage>

    @Query("SELECT * FROM sms_messages WHERE syncHash = :hash AND systemSmsId = :systemId")
    suspend fun findByHashAndSystemId(hash: String, systemId: Long): SmsMessage?

    @Query("SELECT * FROM sms_messages ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentSms(limit: Int): Flow<List<SmsMessage>>

    @Query("SELECT COUNT(*) FROM sms_messages")
    fun getSmsCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM sms_messages WHERE syncedToServer = 0")
    suspend fun getUnsyncedCount(): Int

    @Query("DELETE FROM sms_messages")
    suspend fun deleteAll()

    @Query("DELETE FROM sms_messages WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<Long>)
}
