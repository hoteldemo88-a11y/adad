package com.childmonitor.app.data.remote

import com.childmonitor.app.data.model.ApiResponse
import com.childmonitor.app.data.model.CallLogSyncRequest
import com.childmonitor.app.data.model.ContactSyncRequest
import com.childmonitor.app.data.model.DashboardResponse
import com.childmonitor.app.data.model.DevicePairRequest
import com.childmonitor.app.data.model.DevicePairResponse
import com.childmonitor.app.data.model.SmsSyncRequest
import com.childmonitor.app.data.model.SyncResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    @POST("api/devices/pair")
    suspend fun pairDevice(@Body request: DevicePairRequest): DevicePairResponse

    @POST("api/contacts/sync")
    suspend fun syncContacts(@Body request: ContactSyncRequest): SyncResponse

    @POST("api/calls/sync")
    suspend fun syncCalls(@Body request: CallLogSyncRequest): SyncResponse

    @POST("api/sms/sync")
    suspend fun syncSms(@Body request: SmsSyncRequest): SyncResponse

    @GET("api/dashboard")
    suspend fun getDashboard(): DashboardResponse

    @POST("api/devices/{id}/pause")
    suspend fun pauseMonitoring(@Path("id") deviceId: String): ApiResponse

    @POST("api/devices/{id}/resume")
    suspend fun resumeMonitoring(@Path("id") deviceId: String): ApiResponse
}
