package com.childmonitor.app.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.childmonitor.app.R
import com.childmonitor.app.data.remote.TokenManager
import com.childmonitor.app.ui.MainActivity
import com.childmonitor.app.util.NotificationHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MonitoringManager : Service() {

    @Inject
    lateinit var tokenManager: TokenManager

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var isMonitoring = false

    companion object {
        private const val TAG = "MonitoringManager"
        private const val NOTIFICATION_ID = 1001

        fun start(context: Context) {
            val intent = Intent(context, MonitoringManager::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, MonitoringManager::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        const val ACTION_START = "com.childmonitor.app.action.START_MONITORING"
        const val ACTION_STOP = "com.childmonitor.app.action.STOP_MONITORING"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannels(this)
        Log.d(TAG, "MonitoringManager created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                Log.d(TAG, "Starting monitoring")
                startMonitoring()
            }
            ACTION_STOP -> {
                Log.d(TAG, "Stopping monitoring")
                stopMonitoring()
            }
        }
        return START_STICKY
    }

    private fun startMonitoring() {
        isMonitoring = true
        startForeground(NOTIFICATION_ID, createForegroundNotification("Monitoring active - syncing data..."))

        scope.launch {
            try {
                val isPaired = tokenManager.isDevicePaired()
                if (isPaired) {
                    SyncWorker.enqueuePeriodicSync(this@MonitoringManager)
                    Log.d(TAG, "Periodic sync scheduled")
                } else {
                    Log.w(TAG, "Device not paired, cannot start monitoring")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start monitoring", e)
            }
        }
    }

    private fun stopMonitoring() {
        isMonitoring = false
        SyncWorker.cancelAllSync(this)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        Log.d(TAG, "Monitoring stopped")
    }

    private fun createForegroundNotification(text: String): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, MonitoringManager::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NotificationHelper.CHANNEL_MONITORING)
            .setContentTitle("Child Monitor")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_stop, "Stop", stopPendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
        Log.d(TAG, "MonitoringManager destroyed")
    }
}
