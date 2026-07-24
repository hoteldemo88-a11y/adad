package com.childmonitor.app.di

import android.content.Context
import androidx.room.Room
import com.childmonitor.app.data.local.AppDatabase
import com.childmonitor.app.data.local.CallLogDao
import com.childmonitor.app.data.local.ContactDao
import com.childmonitor.app.data.local.PendingSyncDao
import com.childmonitor.app.data.local.SmsDao
import com.childmonitor.app.data.remote.ApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "child_monitor.db"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideContactDao(database: AppDatabase): ContactDao = database.contactDao()

    @Provides
    fun provideCallLogDao(database: AppDatabase): CallLogDao = database.callLogDao()

    @Provides
    fun provideSmsDao(database: AppDatabase): SmsDao = database.smsDao()

    @Provides
    fun providePendingSyncDao(database: AppDatabase): PendingSyncDao = database.pendingSyncDao()
}
