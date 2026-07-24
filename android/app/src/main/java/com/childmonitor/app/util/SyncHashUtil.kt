package com.childmonitor.app.util

import java.security.MessageDigest

object SyncHashUtil {

    fun computeContactHash(
        phoneNumber: String,
        displayName: String,
        email: String
    ): String {
        val raw = "$phoneNumber|$displayName|$email"
        return computeMd5(raw)
    }

    fun computeCallLogHash(
        phoneNumber: String,
        callType: String,
        duration: Long,
        timestamp: Long
    ): String {
        val raw = "$phoneNumber|$callType|$duration|$timestamp"
        return computeMd5(raw)
    }

    fun computeSmsHash(
        phoneNumber: String,
        body: String,
        type: String,
        timestamp: Long
    ): String {
        val raw = "$phoneNumber|$body|$type|$timestamp"
        return computeMd5(raw)
    }

    fun computeMd5(input: String): String {
        val md5 = MessageDigest.getInstance("MD5")
        val digest = md5.digest(input.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    fun hasChanged(oldHash: String, newHash: String): Boolean {
        return oldHash != newHash
    }
}
