package com.childmonitor.app.ui.screens

import android.app.Activity
import android.os.Build
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Sms
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.childmonitor.app.data.remote.ApiService
import com.childmonitor.app.data.remote.TokenManager
import com.childmonitor.app.data.model.AutoRegisterRequest
import com.childmonitor.app.service.MonitoringManager
import com.childmonitor.app.service.SyncWorker
import com.childmonitor.app.ui.components.PermissionCard
import com.childmonitor.app.ui.theme.StatusGreen
import com.childmonitor.app.util.PermissionUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import javax.inject.Inject

@HiltViewModel
class PermissionViewModel @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    var isRegistering by mutableStateOf(false)
        private set

    var registrationError by mutableStateOf<String?>(null)
        private set

    var registrationSuccess by mutableStateOf(false)
        private set

    fun autoRegister() {
        if (isRegistering) return
        isRegistering = true
        registrationError = null

        viewModelScope.launch {
            try {
                val request = AutoRegisterRequest(
                    deviceName = Build.MODEL,
                    deviceModel = Build.DEVICE,
                    manufacturer = Build.MANUFACTURER,
                    androidVersion = Build.VERSION.RELEASE
                )
                val response = apiService.autoRegister(request)

                tokenManager.saveDeviceToken(response.deviceToken)
                tokenManager.saveDeviceId(response.deviceId)
                tokenManager.markAsPaired()

                registrationSuccess = true
            } catch (e: Exception) {
                registrationError = when {
                    e.message?.contains("timeout", ignoreCase = true) == true -> "Connection timed out. Check your internet."
                    e.message?.contains("Unable to resolve host", ignoreCase = true) == true -> "No internet connection"
                    else -> e.message ?: "Registration failed. Please try again."
                }
                isRegistering = false
            }
        }
    }
}

@Composable
fun PermissionScreen(
    onNavigateToHome: () -> Unit,
    viewModel: PermissionViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val activity = context as Activity
    var permissionStates by remember { mutableStateOf(mapOf<String, Boolean>()) }
    var showRationale by remember { mutableStateOf(false) }
    var currentRationalePermission by remember { mutableStateOf("") }

    val requiredPermissions = remember {
        listOf(
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_SMS
        )
    }

    val optionalPermissions = remember {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            listOf(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            emptyList()
        }
    }

    val allPermissions = remember { requiredPermissions + optionalPermissions }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        permissionStates = permissionStates.toMutableMap().apply {
            results.forEach { (permission, granted) ->
                put(permission, granted)
            }
        }
    }

    LaunchedEffect(Unit) {
        val initialStates = mutableMapOf<String, Boolean>()
        allPermissions.forEach { permission ->
            initialStates[permission] = PermissionUtils.hasPermission(context, permission)
        }
        permissionStates = initialStates
    }

    LaunchedEffect(viewModel.registrationSuccess) {
        if (viewModel.registrationSuccess) {
            MonitoringManager.start(context)
            SyncWorker.enqueuePeriodicSync(context)
            onNavigateToHome()
        }
    }

    val grantedCount = permissionStates.values.count { it }
    val totalCount = allPermissions.size
    val progress = if (totalCount > 0) grantedCount.toFloat() / totalCount else 0f
    val allRequiredGranted = requiredPermissions.all { permissionStates[it] == true }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.background,
                        MaterialTheme.colorScheme.surface
                    )
                )
            )
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        Icon(
            imageVector = Icons.Filled.Shield,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Permissions Required",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "To protect your child, we need access to the following. All data is encrypted and securely transmitted.",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = if (allRequiredGranted) StatusGreen else MaterialTheme.colorScheme.primary,
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "$grantedCount of $totalCount permissions granted",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
        )

        Spacer(modifier = Modifier.height(24.dp))

        PermissionCard(
            title = "Contacts Access",
            description = "Monitor contacts to detect strangers or suspicious people your child communicates with.",
            icon = Icons.Filled.Phone,
            isGranted = permissionStates[Manifest.permission.READ_CONTACTS] == true,
            isRequired = true,
            onRequest = {
                currentRationalePermission = Manifest.permission.READ_CONTACTS
                if (PermissionUtils.shouldShowRationale(activity, Manifest.permission.READ_CONTACTS)) {
                    showRationale = true
                } else {
                    permissionLauncher.launch(arrayOf(Manifest.permission.READ_CONTACTS))
                }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        PermissionCard(
            title = "Call Log Access",
            description = "Track call history to monitor who your child talks to and for how long.",
            icon = Icons.Filled.Phone,
            isGranted = permissionStates[Manifest.permission.READ_CALL_LOG] == true,
            isRequired = true,
            onRequest = {
                currentRationalePermission = Manifest.permission.READ_CALL_LOG
                if (PermissionUtils.shouldShowRationale(activity, Manifest.permission.READ_CALL_LOG)) {
                    showRationale = true
                } else {
                    permissionLauncher.launch(arrayOf(Manifest.permission.READ_CALL_LOG))
                }
            }
        )

        Spacer(modifier = Modifier.height(12.dp))

        PermissionCard(
            title = "SMS Access",
            description = "Read messages to detect cyberbullying, inappropriate content, or danger signals.",
            icon = Icons.Filled.Sms,
            isGranted = permissionStates[Manifest.permission.READ_SMS] == true,
            isRequired = true,
            onRequest = {
                currentRationalePermission = Manifest.permission.READ_SMS
                if (PermissionUtils.shouldShowRationale(activity, Manifest.permission.READ_SMS)) {
                    showRationale = true
                } else {
                    permissionLauncher.launch(arrayOf(Manifest.permission.READ_SMS))
                }
            }
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Spacer(modifier = Modifier.height(12.dp))

            PermissionCard(
                title = "Notifications",
                description = "Required for the monitoring service to run in the background and keep you informed.",
                icon = Icons.Filled.Notifications,
                isGranted = permissionStates[Manifest.permission.POST_NOTIFICATIONS] == true,
                isRequired = false,
                onRequest = {
                    permissionLauncher.launch(arrayOf(Manifest.permission.POST_NOTIFICATIONS))
                }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        AnimatedVisibility(
            visible = showRationale,
            enter = fadeIn() + slideInVertically()
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Info,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Permission Needed",
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "This permission is essential for monitoring your child's safety. Without it, we cannot provide full protection.",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row {
                        TextButton(onClick = { showRationale = false }) {
                            Text("Cancel")
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        Button(onClick = {
                            showRationale = false
                            permissionLauncher.launch(arrayOf(currentRationalePermission))
                        }) {
                            Text("Grant Permission")
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        AnimatedVisibility(visible = viewModel.registrationError != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Filled.Error,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = viewModel.registrationError ?: "",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
        }

        Button(
            onClick = {
                if (allRequiredGranted && !viewModel.isRegistering) {
                    viewModel.autoRegister()
                } else if (!allRequiredGranted) {
                    val missingPermissions = requiredPermissions.filter {
                        permissionStates[it] != true
                    }.toTypedArray()
                    permissionLauncher.launch(missingPermissions)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .clip(RoundedCornerShape(16.dp)),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (allRequiredGranted) StatusGreen else MaterialTheme.colorScheme.primary
            ),
            enabled = !viewModel.isRegistering
        ) {
            if (viewModel.isRegistering) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Setting up device...",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold
                )
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (allRequiredGranted) "Start Monitoring" else "Grant Permissions",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Filled.ArrowForward,
                        contentDescription = null
                    )
                }
            }
        }

        if (!allRequiredGranted && !viewModel.isRegistering) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "All required permissions must be granted to continue",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}
