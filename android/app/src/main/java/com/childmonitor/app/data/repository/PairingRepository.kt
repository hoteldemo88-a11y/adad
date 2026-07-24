package com.childmonitor.app.data.repository

import com.childmonitor.app.data.model.DevicePairRequest
import com.childmonitor.app.data.remote.ApiService
import com.childmonitor.app.data.remote.TokenManager
import javax.inject.Inject
import javax.inject.Singleton

sealed class PairingResult {
    data object Success : PairingResult()
    data class Error(val message: String) : PairingResult()
}

@Singleton
class PairingRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) {

    suspend fun pairDevice(
        pairingCode: String,
        deviceName: String,
        deviceModel: String,
        androidVersion: String
    ): PairingResult {
        return try {
            val request = DevicePairRequest(
                pairingCode = pairingCode,
                deviceName = deviceName,
                deviceModel = deviceModel,
                androidVersion = androidVersion
            )
            val response = apiService.pairDevice(request)

            if (response.success) {
                tokenManager.saveDeviceToken(response.deviceToken)
                tokenManager.saveDeviceId(response.deviceId)
                tokenManager.saveParentId(response.parentId)
                tokenManager.markAsPaired()
                PairingResult.Success
            } else {
                PairingResult.Error(response.message.ifEmpty { "Pairing failed. Check the code and try again." })
            }
        } catch (e: Exception) {
            PairingResult.Error(
                when {
                    e.message?.contains("404") == true -> "Invalid pairing code"
                    e.message?.contains("409") == true -> "This device is already paired"
                    e.message?.contains("timeout", ignoreCase = true) == true -> "Connection timed out. Check your internet."
                    e.message?.contains("Unable to resolve host", ignoreCase = true) == true -> "No internet connection"
                    else -> e.message ?: "Pairing failed. Please try again."
                }
            )
        }
    }

    suspend fun isPaired(): Boolean {
        return tokenManager.isDevicePaired()
    }

    suspend fun unpair() {
        tokenManager.unpair()
    }
}
