package com.childmonitor.app.ui.screens

import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.BatteryStd
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.childmonitor.app.data.repository.PairingRepository
import com.childmonitor.app.service.MonitoringManager
import com.childmonitor.app.service.SyncWorker
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val pairingRepository: PairingRepository
) : ViewModel() {

    var isMonitoringPaused by mutableStateOf(false)
    var syncIntervalMinutes by mutableFloatStateOf(15f)
    var showUnpairDialog by mutableStateOf(false)
    var unpairSuccess by mutableStateOf(false)
    var deviceModel by mutableStateOf(Build.MODEL)
    var androidVersion by mutableStateOf(Build.VERSION.RELEASE)
    var manufacturer by mutableStateOf(Build.MANUFACTURER)
    var appVersion by mutableStateOf("1.0.0")

    fun toggleMonitoring(context: android.content.Context) {
        isMonitoringPaused = !isMonitoringPaused
        if (isMonitoringPaused) {
            MonitoringManager.stop(context)
            SyncWorker.cancelAllSync(context)
        } else {
            MonitoringManager.start(context)
            SyncWorker.enqueuePeriodicSync(context)
        }
    }

    fun updateSyncInterval(minutes: Float) {
        syncIntervalMinutes = minutes
    }

    fun unpairDevice(context: android.content.Context) {
        viewModelScope.launch {
            MonitoringManager.stop(context)
            SyncWorker.cancelAllSync(context)
            pairingRepository.unpair()
            unpairSuccess = true
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToPermissions: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val context = LocalContext.current

    if (viewModel.unpairSuccess) {
        onNavigateToPermissions()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
        ) {
            SettingsSectionHeader(title = "Monitoring")

            SettingsItem(
                icon = if (viewModel.isMonitoringPaused) Icons.Filled.PlayArrow else Icons.Filled.Pause,
                title = "Monitoring Status",
                subtitle = if (viewModel.isMonitoringPaused) "Paused" else "Active",
                onClick = { viewModel.toggleMonitoring(context) }
            )

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Filled.Schedule,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Sync Interval",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${viewModel.syncIntervalMinutes.toInt()} minutes",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Slider(
                        value = viewModel.syncIntervalMinutes,
                        onValueChange = { viewModel.updateSyncInterval(it) },
                        valueRange = 5f..60f,
                        steps = 10,
                        modifier = Modifier.padding(horizontal = 16.dp),
                        colors = SliderDefaults.colors(
                            thumbColor = MaterialTheme.colorScheme.primary,
                            activeTrackColor = MaterialTheme.colorScheme.primary
                        )
                    )
                }
            }

            SettingsSectionHeader(title = "System")

            SettingsItem(
                icon = Icons.Filled.Notifications,
                title = "Notification Settings",
                subtitle = "Manage notification preferences",
                onClick = {
                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    }
                    context.startActivity(intent)
                }
            )

            SettingsItem(
                icon = Icons.Filled.BatteryStd,
                title = "Battery Optimization",
                subtitle = "Exclude from battery optimization for reliable sync",
                onClick = {
                    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    context.startActivity(intent)
                }
            )

            SettingsSectionHeader(title = "Device Information")

            SettingsInfoItem(
                icon = Icons.Filled.Devices,
                title = "Device Model",
                value = "${viewModel.manufacturer} ${viewModel.deviceModel}"
            )

            SettingsInfoItem(
                icon = Icons.Filled.Apps,
                title = "Android Version",
                value = viewModel.androidVersion
            )

            SettingsInfoItem(
                icon = Icons.Filled.Code,
                title = "App Version",
                value = viewModel.appVersion
            )

            SettingsSectionHeader(title = "Device")

            SettingsItem(
                icon = Icons.Filled.LinkOff,
                title = "Unpair Device",
                subtitle = "Remove this device from monitoring and clear all data",
                onClick = { viewModel.showUnpairDialog = true },
                iconTint = MaterialTheme.colorScheme.error,
                titleColor = MaterialTheme.colorScheme.error
            )

            Spacer(modifier = Modifier.height(32.dp))
        }

        if (viewModel.showUnpairDialog) {
            AlertDialog(
                onDismissRequest = { viewModel.showUnpairDialog = false },
                title = { Text("Unpair Device") },
                text = {
                    Text("This will remove this device from monitoring, stop all data collection, and clear locally stored data. Your parent will need to re-pair this device to resume monitoring.")
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            viewModel.showUnpairDialog = false
                            viewModel.unpairDevice(context)
                        }
                    ) {
                        Text("Unpair", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { viewModel.showUnpairDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun SettingsSectionHeader(title: String) {
    Text(
        text = title,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
        letterSpacing = 1.sp
    )
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    iconTint: Color = MaterialTheme.colorScheme.primary,
    titleColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = iconTint,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = titleColor
            )
            Text(
                text = subtitle,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
    Divider(modifier = Modifier.padding(horizontal = 16.dp))
}

@Composable
fun SettingsInfoItem(
    icon: ImageVector,
    title: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Text(
            text = title,
            fontSize = 16.sp,
            modifier = Modifier.weight(1f),
            color = MaterialTheme.colorScheme.onSurface
        )
        Text(
            text = value,
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
    Divider(modifier = Modifier.padding(horizontal = 16.dp))
}
