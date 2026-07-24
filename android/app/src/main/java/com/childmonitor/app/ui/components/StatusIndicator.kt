package com.childmonitor.app.ui.components

import androidx.compose.animation.animateColor
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.childmonitor.app.ui.theme.StatusGreen
import com.childmonitor.app.ui.theme.StatusRed
import com.childmonitor.app.ui.theme.StatusYellow

@Composable
fun StatusIndicator(
    isActive: Boolean,
    modifier: Modifier = Modifier,
    isSyncing: Boolean = false
) {
    val infiniteTransition = rememberInfiniteTransition(label = "statusPulse")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isActive) 1.3f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    val color by infiniteTransition.animateColor(
        initialValue = if (isActive) StatusGreen else StatusRed,
        targetValue = if (isActive) StatusGreen.copy(alpha = 0.6f) else StatusRed.copy(alpha = 0.6f),
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseColor"
    )

    val indicatorColor = when {
        isSyncing -> StatusYellow
        isActive -> color
        else -> StatusRed
    }

    Box(
        modifier = modifier
            .scale(if (isActive && !isSyncing) pulseScale else 1f)
            .size(12.dp)
            .clip(CircleShape)
            .background(indicatorColor)
    )
}
