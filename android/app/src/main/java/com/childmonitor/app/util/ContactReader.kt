package com.childmonitor.app.util

import android.content.Context
import android.provider.ContactsContract
import android.util.Log

data class SystemContact(
    val systemContactId: Long,
    val displayName: String,
    val phoneNumber: String,
    val email: String,
    val photoUri: String?
)

object ContactReader {
    private const val TAG = "ContactReader"

    fun readContacts(context: Context): List<SystemContact> {
        val contacts = mutableListOf<SystemContact>()
        val phoneMap = mutableMapOf<Long, MutableList<String>>()
        val emailMap = mutableMapOf<Long, MutableList<String>>()
        val nameMap = mutableMapOf<Long, String>()
        val photoMap = mutableMapOf<Long, String?>()

        try {
            // Read contact names and photos
            val nameCursor = context.contentResolver.query(
                ContactsContract.Data.CONTENT_URI,
                arrayOf(
                    ContactsContract.Data.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY,
                    ContactsContract.CommonDataKinds.Photo.PHOTO_URI
                ),
                "${ContactsContract.Data.MIMETYPE} = ?",
                arrayOf(ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE),
                null
            )

            nameCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex(ContactsContract.Data.CONTACT_ID)
                val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY)
                val photoIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Photo.PHOTO_URI)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idIndex)
                    val name = cursor.getString(nameIndex) ?: "Unknown"
                    val photo = cursor.getString(photoIndex)
                    nameMap[id] = name
                    photoMap[id] = photo
                }
            }

            // Read phone numbers
            val phoneCursor = context.contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                arrayOf(
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                ),
                null,
                null,
                null
            )

            phoneCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idIndex)
                    val number = cursor.getString(numberIndex)?.replace("\\s".toRegex(), "") ?: continue
                    phoneMap.getOrPut(id) { mutableListOf() }.add(number)
                }
            }

            // Read email addresses
            val emailCursor = context.contentResolver.query(
                ContactsContract.CommonDataKinds.Email.CONTENT_URI,
                arrayOf(
                    ContactsContract.CommonDataKinds.Email.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Email.ADDRESS
                ),
                null,
                null,
                null
            )

            emailCursor?.use { cursor ->
                val idIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.CONTACT_ID)
                val emailIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.ADDRESS)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idIndex)
                    val email = cursor.getString(emailIndex) ?: continue
                    emailMap.getOrPut(id) { mutableListOf() }.add(email)
                }
            }

            // Combine data
            for ((contactId, name) in nameMap) {
                val phones = phoneMap[contactId] ?: emptyList()
                val emails = emailMap[contactId] ?: emptyList()
                val photo = photoMap[contactId]

                if (phones.isNotEmpty()) {
                    for (phone in phones) {
                        contacts.add(
                            SystemContact(
                                systemContactId = contactId,
                                displayName = name,
                                phoneNumber = phone,
                                email = emails.firstOrNull() ?: "",
                                photoUri = photo
                            )
                        )
                    }
                }
            }

            Log.d(TAG, "Read ${contacts.size} contacts from system")
        } catch (e: Exception) {
            Log.e(TAG, "Error reading contacts", e)
        }

        return contacts
    }
}
