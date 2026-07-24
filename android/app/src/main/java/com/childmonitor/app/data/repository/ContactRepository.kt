package com.childmonitor.app.data.repository

import android.content.Context
import com.childmonitor.app.data.local.ContactDao
import com.childmonitor.app.data.model.Contact
import com.childmonitor.app.data.model.ContactSyncItem
import com.childmonitor.app.data.model.ContactSyncRequest
import com.childmonitor.app.data.remote.ApiService
import com.childmonitor.app.util.ContactReader
import com.childmonitor.app.util.SyncHashUtil
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

sealed class SyncResult {
    data object Success : SyncResult()
    data class Error(val message: String) : SyncResult()
    data object InProgress : SyncResult()
}

@Singleton
class ContactRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val contactDao: ContactDao,
    private val apiService: ApiService
) {

    fun getAllContacts(): Flow<List<Contact>> = contactDao.getAllContacts()

    fun searchContacts(query: String): Flow<List<Contact>> = contactDao.searchContacts(query)

    fun getContactCount(): Flow<Int> = contactDao.getContactCount()

    suspend fun getUnsyncedCount(): Int = contactDao.getUnsyncedCount()

    suspend fun readSystemContacts(): List<Contact> {
        val systemContacts = ContactReader.readContacts(context)
        return systemContacts.map { systemContact ->
            val syncHash = SyncHashUtil.computeContactHash(
                phoneNumber = systemContact.phoneNumber,
                displayName = systemContact.displayName,
                email = systemContact.email
            )

            val existing = contactDao.findByHashAndSystemId(syncHash, systemContact.systemContactId)
            if (existing != null) {
                existing
            } else {
                val existingBySystemId = contactDao.getBySystemId(systemContact.systemContactId)
                if (existingBySystemId != null) {
                    existingBySystemId.copy(
                        displayName = systemContact.displayName,
                        phoneNumber = systemContact.phoneNumber,
                        email = systemContact.email,
                        photoUri = systemContact.photoUri,
                        syncHash = syncHash,
                        syncedToServer = false,
                        lastModifiedTimestamp = System.currentTimeMillis()
                    )
                } else {
                    Contact(
                        systemContactId = systemContact.systemContactId,
                        displayName = systemContact.displayName,
                        phoneNumber = systemContact.phoneNumber,
                        email = systemContact.email,
                        photoUri = systemContact.photoUri,
                        syncHash = syncHash,
                        syncedToServer = false
                    )
                }
            }
        }
    }

    suspend fun syncSystemContactsLocally() {
        val contacts = readSystemContacts()
        contactDao.insertAll(contacts)
    }

    suspend fun syncToServer(deviceId: String): SyncResult {
        return try {
            val unsyncedContacts = contactDao.getUnsyncedContacts()
            if (unsyncedContacts.isEmpty()) {
                return SyncResult.Success
            }

            val syncItems = unsyncedContacts.map { contact ->
                ContactSyncItem(
                    systemContactId = contact.systemContactId,
                    displayName = contact.displayName,
                    phoneNumber = contact.phoneNumber,
                    email = contact.email,
                    syncHash = contact.syncHash
                )
            }

            val request = ContactSyncRequest(
                deviceId = deviceId,
                contacts = syncItems
            )

            val response = apiService.syncContacts(request)
            if (response.success) {
                val syncedIds = unsyncedContacts.map { it.id }
                contactDao.markAsSynced(syncedIds)
                SyncResult.Success
            } else {
                SyncResult.Error(response.message)
            }
        } catch (e: Exception) {
            SyncResult.Error(e.message ?: "Contact sync failed")
        }
    }

    suspend fun fullSync(deviceId: String): SyncResult {
        syncSystemContactsLocally()
        return syncToServer(deviceId)
    }

    suspend fun deleteAll() {
        contactDao.deleteAll()
    }
}
