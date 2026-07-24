package com.childmonitor.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.childmonitor.app.data.model.CallLog
import com.childmonitor.app.data.model.Contact
import com.childmonitor.app.data.model.PendingSync
import com.childmonitor.app.data.model.SmsMessage

@Database(
    entities = [
        Contact::class,
        CallLog::class,
        SmsMessage::class,
        PendingSync::class
    ],
    version = 2,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun contactDao(): ContactDao
    abstract fun callLogDao(): CallLogDao
    abstract fun smsDao(): SmsDao
    abstract fun pendingSyncDao(): PendingSyncDao
}
