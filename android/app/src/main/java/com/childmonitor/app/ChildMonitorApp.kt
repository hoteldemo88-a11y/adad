package com.childmonitor.app

import android.app.Application
import android.util.Log
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.childmonitor.app.service.NetworkConnectivityObserver
import com.childmonitor.app.util.NotificationHelper
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class ChildMonitorApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    @Inject
    lateinit var networkConnectivityObserver: NetworkConnectivityObserver

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(Log.INFO)
            .build()

    override fun onCreate() {
        super.onCreate()

        NotificationHelper.createNotificationChannels(this)

        networkConnectivityObserver.observeConnectivityAndSync(this)

        Log.d("ChildMonitorApp", "Application initialized")
    }
}
