package com.childmonitor.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.childmonitor.app.data.model.Contact
import kotlinx.coroutines.flow.Flow

@Dao
interface ContactDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(contact: Contact): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(contacts: List<Contact>)

    @Update
    suspend fun update(contact: Contact)

    @Query("UPDATE contacts SET syncedToServer = 1 WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<Long>)

    @Query("UPDATE contacts SET syncedToServer = 0")
    suspend fun markAllAsUnsynced()

    @Query("SELECT * FROM contacts ORDER BY displayName ASC")
    fun getAllContacts(): Flow<List<Contact>>

    @Query("SELECT * FROM contacts WHERE id = :id")
    suspend fun getById(id: Long): Contact?

    @Query("SELECT * FROM contacts WHERE systemContactId = :systemId")
    suspend fun getBySystemId(systemId: Long): Contact?

    @Query("SELECT * FROM contacts WHERE displayName LIKE '%' || :query || '%' OR phoneNumber LIKE '%' || :query || '%'")
    fun searchContacts(query: String): Flow<List<Contact>>

    @Query("SELECT * FROM contacts WHERE isFavorite = 1 ORDER BY displayName ASC")
    fun getFavoriteContacts(): Flow<List<Contact>>

    @Query("SELECT * FROM contacts WHERE syncedToServer = 0")
    suspend fun getUnsyncedContacts(): List<Contact>

    @Query("SELECT * FROM contacts WHERE syncHash = :hash AND systemContactId = :systemId")
    suspend fun findByHashAndSystemId(hash: String, systemId: Long): Contact?

    @Query("SELECT COUNT(*) FROM contacts")
    fun getContactCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM contacts WHERE syncedToServer = 0")
    suspend fun getUnsyncedCount(): Int

    @Query("DELETE FROM contacts")
    suspend fun deleteAll()

    @Query("DELETE FROM contacts WHERE id IN (:ids)")
    suspend fun deleteByIds(ids: List<Long>)
}
