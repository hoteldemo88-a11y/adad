package com.childmonitor.app.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

object NotificationHelper {

    const val CHANNEL_MONITORING = "monitoring_channel"
    const val CHANNEL_SYNC = "sync_channel"
    const val CHANNEL_ALERTS = "alerts_channel"

    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val monitoringChannel = NotificationChannel(
                CHANNEL_MONITORING,
                "Monitoring Status",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows monitoring service status"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }

            val syncChannel = NotificationChannel(
                CHANNEL_SYNC,
                "Data Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows data synchronization progress"
                setShowBadge(false)
                enableVibration(false)
            }

            val alertsChannel = NotificationChannel(
                CHANNEL_ALERTS,
                "Safety Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows safety alerts and warnings"
                enableVibration(true)
                enableLights(true)
            }

            notificationManager.createNotificationChannel(monitoringChannel)
            notificationManager.createNotificationChannel(syncChannel)
            notificationManager.createNotificationChannel(alertsChannel)
        }
    }
}
