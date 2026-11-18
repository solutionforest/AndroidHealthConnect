package com.androidhealthconnect

import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.BloodGlucoseRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ElevationGainedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.FloorsClimbedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Validates write-path JSON → Health Connect Record mapping for every type
 * listed in the README "Supported record types" table.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class RecordMapperTest {

    @Test
    fun jsonToRecord_mapsAllSupportedTypes() {
        val cases = supportedWriteCases()
        assertEquals("README supported record types", 19, cases.size)

        cases.forEach { (recordType, json, expectedClass) ->
            val record: Record = RecordMapper.jsonToRecord(json)
            assertTrue(
                "Expected ${expectedClass.simpleName} for $recordType, got ${record::class.java.simpleName}",
                expectedClass.isInstance(record)
            )
        }
    }

    @Test
    fun jsonToRecord_rejectsUnknownType() {
        val json = JSONObject()
            .put("recordType", "NotARealType")
            .put("startTime", START)
            .put("endTime", END)

        try {
            RecordMapper.jsonToRecord(json)
            throw AssertionError("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message!!.contains("Unsupported record type"))
        }
    }

    private data class Case(
        val recordType: String,
        val json: JSONObject,
        val expectedClass: Class<out Record>,
    )

    private fun supportedWriteCases(): List<Case> = listOf(
        Case(
            "Steps",
            interval("Steps") { put("count", 5000) },
            StepsRecord::class.java
        ),
        Case(
            "HeartRate",
            interval("HeartRate") {
                put(
                    "samples",
                    JSONArray().put(
                        JSONObject().put("time", TIME).put("beatsPerMinute", 72)
                    )
                )
            },
            HeartRateRecord::class.java
        ),
        Case(
            "SleepSession",
            interval("SleepSession") {
                put(
                    "stages",
                    JSONArray().put(
                        JSONObject()
                            .put("startTime", START)
                            .put("endTime", END)
                            .put("stage", 5)
                    )
                )
            },
            SleepSessionRecord::class.java
        ),
        Case(
            "ActiveCaloriesBurned",
            interval("ActiveCaloriesBurned") { put("energy", 120.0) },
            ActiveCaloriesBurnedRecord::class.java
        ),
        Case(
            "TotalCaloriesBurned",
            interval("TotalCaloriesBurned") { put("energy", 1800.0) },
            TotalCaloriesBurnedRecord::class.java
        ),
        Case(
            "Distance",
            interval("Distance") { put("distance", 3200.0) },
            DistanceRecord::class.java
        ),
        Case(
            "Weight",
            instant("Weight") { put("weight", 72.5) },
            WeightRecord::class.java
        ),
        Case(
            "Height",
            instant("Height") { put("height", 1.75) },
            HeightRecord::class.java
        ),
        Case(
            "BloodPressure",
            instant("BloodPressure") {
                put("systolic", 120.0)
                put("diastolic", 80.0)
            },
            BloodPressureRecord::class.java
        ),
        Case(
            "BloodGlucose",
            instant("BloodGlucose") { put("level", 5.4) },
            BloodGlucoseRecord::class.java
        ),
        Case(
            "OxygenSaturation",
            instant("OxygenSaturation") { put("percentage", 98.0) },
            OxygenSaturationRecord::class.java
        ),
        Case(
            "BodyTemperature",
            instant("BodyTemperature") { put("temperature", 36.6) },
            BodyTemperatureRecord::class.java
        ),
        Case(
            "BodyFat",
            instant("BodyFat") { put("percentage", 18.5) },
            BodyFatRecord::class.java
        ),
        Case(
            "Hydration",
            interval("Hydration") { put("volume", 0.5) },
            HydrationRecord::class.java
        ),
        Case(
            "ExerciseSession",
            interval("ExerciseSession") {
                put("exerciseType", 56)
                put("title", "Run")
            },
            ExerciseSessionRecord::class.java
        ),
        Case(
            "RestingHeartRate",
            instant("RestingHeartRate") { put("beatsPerMinute", 58) },
            RestingHeartRateRecord::class.java
        ),
        Case(
            "RespiratoryRate",
            instant("RespiratoryRate") { put("rate", 16.0) },
            RespiratoryRateRecord::class.java
        ),
        Case(
            "FloorsClimbed",
            interval("FloorsClimbed") { put("floors", 3.0) },
            FloorsClimbedRecord::class.java
        ),
        Case(
            "ElevationGained",
            interval("ElevationGained") { put("elevation", 40.0) },
            ElevationGainedRecord::class.java
        ),
        Case(
            "MindfulnessSession",
            interval("MindfulnessSession") {
                put("mindfulnessSessionType", 1)
                put("title", "Lake meditation")
            },
            MindfulnessSessionRecord::class.java
        ),
        Case(
            "SkinTemperature",
            interval("SkinTemperature") {
                put(
                    "deltas",
                    JSONArray().put(
                        JSONObject().put("time", TIME).put("delta", 0.2)
                    )
                )
                put("baseline", 33.5)
                put("measurementLocation", 3)
            },
            SkinTemperatureRecord::class.java
        ),
        Case(
            "ActivityIntensity",
            interval("ActivityIntensity") { put("activityIntensityType", 0) },
            ActivityIntensityRecord::class.java
        ),
    )

    private fun interval(type: String, extra: JSONObject.() -> Unit = {}) =
        JSONObject().apply {
            put("recordType", type)
            put("startTime", START)
            put("endTime", END)
            extra()
        }

    private fun instant(type: String, extra: JSONObject.() -> Unit = {}) =
        JSONObject().apply {
            put("recordType", type)
            put("time", TIME)
            extra()
        }

    companion object {
        private const val START = "2024-01-01T08:00:00Z"
        private const val END = "2024-01-01T09:00:00Z"
        private const val TIME = "2024-01-01T08:00:00Z"
    }
}
