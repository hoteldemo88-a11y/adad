package com.childmonitor.app.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.childmonitor.app.data.remote.TokenManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class BootReceiver : BroadcastReceiver() {

    @Inject
    lateinit var tokenManager: TokenManager

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "Boot received with action: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            val pendingResult = goAsync()
            scope.launch {
                try {
                    val isPaired = tokenManager.isDevicePaired()
                    if (isPaired) {
                        Log.d(TAG, "Device is paired, re-enabling sync workers")
                        SyncWorker.enqueuePeriodicSync(context)
                        SyncWorker.enqueueImmediateSync(context)
                    } else {
                        Log.d(TAG, "Device not paired, skipping sync setup")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error in boot receiver", e)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
