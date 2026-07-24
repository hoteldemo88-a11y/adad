package com.childmonitor.app.util

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

object PermissionUtils {

    val REQUIRED_PERMISSIONS = buildList {
        add(Manifest.permission.READ_CONTACTS)
        add(Manifest.permission.READ_CALL_LOG)
        add(Manifest.permission.READ_SMS)
        add(Manifest.permission.INTERNET)
        add(Manifest.permission.ACCESS_NETWORK_STATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }.toTypedArray()

    data class PermissionInfo(
        val permission: String,
        val title: String,
        val description: String,
        val isRequired: Boolean = true
    )

    fun getPermissionInfoList(): List<PermissionInfo> = listOf(
        PermissionInfo(
            permission = Manifest.permission.READ_CONTACTS,
            title = "Contacts Access",
            description = "Required to monitor contacts on the device for safety alerts.",
            isRequired = true
        ),
        PermissionInfo(
            permission = Manifest.permission.READ_CALL_LOG,
            title = "Call Log Access",
            description = "Required to monitor call history and detect unknown callers.",
            isRequired = true
        ),
        PermissionInfo(
            permission = Manifest.permission.READ_SMS,
            title = "SMS Access",
            description = "Required to monitor text messages for cyberbullying and danger detection.",
            isRequired = true
        ),
        PermissionInfo(
            permission = Manifest.permission.POST_NOTIFICATIONS,
            title = "Notifications",
            description = "Required to show monitoring status and important alerts.",
            isRequired = false
        )
    )

    fun hasPermission(context: Context, permission: String): Boolean {
        return ContextCompat.checkSelfPermission(
            context, permission
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun hasAllRequiredPermissions(context: Context): Boolean {
        return REQUIRED_PERMISSIONS.all { hasPermission(context, it) }
    }

    fun getRequiredPermissions(): List<String> {
        return REQUIRED_PERMISSIONS.filter { permission ->
            when (permission) {
                Manifest.permission.POST_NOTIFICATIONS -> false
                Manifest.permission.INTERNET, Manifest.permission.ACCESS_NETWORK_STATE -> false
                else -> true
            }
        }
    }

    fun getDeniedPermissions(context: Context): List<String> {
        return getRequiredPermissions().filter { !hasPermission(context, it) }
    }

    fun allRequiredPermissionsGranted(context: Context): Boolean {
        return getRequiredPermissions().all { hasPermission(context, it) }
    }

    fun requestPermissions(activity: Activity, permissions: Array<String>, requestCode: Int) {
        ActivityCompat.requestPermissions(activity, permissions, requestCode)
    }

    fun shouldShowRationale(activity: Activity, permission: String): Boolean {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    }
}
