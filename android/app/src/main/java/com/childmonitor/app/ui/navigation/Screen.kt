package com.childmonitor.app.ui.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Permissions : Screen("permissions")
    data object Home : Screen("home")
    data object Settings : Screen("settings")
}
