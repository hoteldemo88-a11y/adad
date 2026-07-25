package com.childmonitor.app.data.remote

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.tokenDataStore: DataStore<Preferences> by preferencesDataStore(name = "device_auth")

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore get() = context.tokenDataStore

    companion object {
        private val DEVICE_TOKEN = stringPreferencesKey("device_token")
        private val DEVICE_ID = stringPreferencesKey("device_id")
        private val PARENT_ID = stringPreferencesKey("parent_id")
        private val IS_PAIRED = booleanPreferencesKey("is_paired")
        private val TOKEN_EXPIRY = longPreferencesKey("token_expiry")
        private val LAST_SYNC_TIME = longPreferencesKey("last_sync_time")
    }

    suspend fun saveDeviceToken(token: String) {
        dataStore.edit { prefs ->
            prefs[DEVICE_TOKEN] = token
            prefs[TOKEN_EXPIRY] = System.currentTimeMillis() + (24 * 60 * 60 * 1000)
        }
    }

    suspend fun getDeviceToken(): String? {
        return dataStore.data.map { prefs ->
            prefs[DEVICE_TOKEN]
        }.first()
    }

    suspend fun saveDeviceId(deviceId: String) {
        dataStore.edit { prefs ->
            prefs[DEVICE_ID] = deviceId
        }
    }

    suspend fun getDeviceId(): String? {
        return dataStore.data.map { prefs ->
            prefs[DEVICE_ID]
        }.first()
    }

    suspend fun saveParentId(parentId: String) {
        dataStore.edit { prefs ->
            prefs[PARENT_ID] = parentId
        }
    }

    suspend fun getParentId(): String? {
        return dataStore.data.map { prefs ->
            prefs[PARENT_ID]
        }.first()
    }

    suspend fun markAsPaired() {
        dataStore.edit { prefs ->
            prefs[IS_PAIRED] = true
        }
    }

    suspend fun isDevicePaired(): Boolean {
        return dataStore.data.map { prefs ->
            (prefs[IS_PAIRED] == true || prefs[DEVICE_ID] != null) && prefs[DEVICE_TOKEN] != null
        }.first()
    }

    suspend fun updateLastSyncTime() {
        dataStore.edit { prefs ->
            prefs[LAST_SYNC_TIME] = System.currentTimeMillis()
        }
    }

    suspend fun getLastSyncTime(): Long {
        return dataStore.data.map { prefs ->
            prefs[LAST_SYNC_TIME] ?: 0L
        }.first()
    }

    suspend fun refreshDeviceToken(): Boolean {
        val currentToken = getDeviceToken() ?: return false
        val expiry = dataStore.data.map { prefs ->
            prefs[TOKEN_EXPIRY] ?: 0L
        }.first()

        if (System.currentTimeMillis() < expiry - (60 * 60 * 1000)) {
            return true
        }

        return try {
            dataStore.edit { prefs ->
                prefs[TOKEN_EXPIRY] = System.currentTimeMillis() + (24 * 60 * 60 * 1000)
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun clearAll() {
        dataStore.edit { prefs ->
            prefs.clear()
        }
    }

    suspend fun unpair() {
        dataStore.edit { prefs ->
            prefs.remove(DEVICE_TOKEN)
            prefs.remove(DEVICE_ID)
            prefs.remove(PARENT_ID)
            prefs[IS_PAIRED] = false
        }
    }
}
