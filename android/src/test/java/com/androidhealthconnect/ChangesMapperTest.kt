package com.androidhealthconnect

import androidx.health.connect.client.records.StepsRecord
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ChangesMapperTest {

    @Test
    fun parseTokenRequest_mapsRecordTypesAndOrigins() {
        val request =
            ChangesMapper.parseTokenRequest(
                JSONObject()
                    .put("recordTypes", JSONArray().put("Steps").put("Weight"))
                    .put("dataOriginFilters", JSONArray().put("com.example.app"))
            )
        assertEquals(2, request.recordTypes.size)
        assertTrue(request.recordTypes.contains(StepsRecord::class))
        assertEquals(1, request.dataOriginFilters.size)
        assertEquals("com.example.app", request.dataOriginFilters.first().packageName)
    }

    @Test
    fun parseTokenRequest_rejectsEmptyRecordTypes() {
        try {
            ChangesMapper.parseTokenRequest(JSONObject().put("recordTypes", JSONArray()))
            throw AssertionError("expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("recordTypes"))
        }
    }

    @Test
    fun parseTokenRequest_rejectsMissingRecordTypes() {
        try {
            ChangesMapper.parseTokenRequest(JSONObject())
            throw AssertionError("expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("recordTypes"))
        }
    }

    @Test
    fun requireToken_rejectsBlank() {
        try {
            ChangesMapper.requireToken("  ")
            throw AssertionError("expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("changesToken"))
        }
    }

    @Test
    fun responseToJson_serialisesEmptyPage() {
        val json =
            ChangesMapper.responseToJson(
                changes = emptyList(),
                nextChangesToken = "next-token",
                hasMore = false,
                changesTokenExpired = true,
            )
        assertEquals(0, json.getJSONArray("upsertionChanges").length())
        assertEquals(0, json.getJSONArray("deletionChanges").length())
        assertEquals("next-token", json.getString("nextChangesToken"))
        assertFalse(json.getBoolean("hasMore"))
        assertTrue(json.getBoolean("changesTokenExpired"))
    }
}
