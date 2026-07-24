package com.childmonitor.app.data.repository

import com.childmonitor.app.data.remote.TokenManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeviceRepository @Inject constructor(
    private val tokenManager: TokenManager
) {

    suspend fun isPaired(): Boolean {
        return tokenManager.isDevicePaired()
    }

    suspend fun getDeviceId(): String? {
        return tokenManager.getDeviceId()
    }

    suspend fun getParentId(): String? {
        return tokenManager.getParentId()
    }

    suspend fun unpair() {
        tokenManager.unpair()
    }
}
