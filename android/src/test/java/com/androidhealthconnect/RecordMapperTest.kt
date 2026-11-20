package com.androidhealthconnect

import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ActivityIntensityRecord
import androidx.health.connect.client.records.BloodGlucoseRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.BodyFatRecord
import androidx.health.connect.client.records.BodyTemperatureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ElevationGainedRecord
import androidx.health.connect.client.records.ExerciseRoute
import androidx.health.connect.client.records.ExerciseRouteResult
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.FloorsClimbedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.MindfulnessSessionRecord
import androidx.health.connect.client.records.OxygenSaturationRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.RespiratoryRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SkinTemperatureRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.units.Length
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
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
        assertEquals("README supported record types", 22, cases.size)

        cases.forEach { (recordType, json, expectedClass) ->
            val record: Record = RecordMapper.jsonToRecord(json)
            assertTrue(
                "Expected ${expectedClass.simpleName} for $recordType, got ${record::class.java.simpleName}",
                expectedClass.isInstance(record)
            )
        }
    }

    @Test
    fun jsonToMetadata_preservesIdForUpdate() {
        val meta =
            RecordMapper.jsonToMetadata(
                JSONObject()
                    .put("id", "hc-record-1")
                    .put("recordingMethod", 3)
                    .put(
                        "device",
                        JSONObject()
                            .put("type", 2)
                            .put("manufacturer", "Acme")
                            .put("model", "Phone")
                    )
            )
        assertEquals("hc-record-1", meta.id)
        assertEquals(3, meta.recordingMethod)
        assertEquals(2, meta.device?.type)
        assertEquals("Acme", meta.device?.manufacturer)
    }

    @Test
    fun jsonToMetadata_manualEntryWithoutId() {
        val meta =
            RecordMapper.jsonToMetadata(
                JSONObject().put("clientRecordId", "client-1").put("clientRecordVersion", 2)
            )
        assertEquals("", meta.id)
        assertEquals("client-1", meta.clientRecordId)
        assertEquals(2L, meta.clientRecordVersion)
    }

    @Test
    fun requireMetadataIdForUpdate_returnsId() {
        val json =
            JSONObject()
                .put("recordType", "Steps")
                .put("metadata", JSONObject().put("id", "upd-1"))
        assertEquals("upd-1", RecordMapper.requireMetadataIdForUpdate(json))
    }

    @Test
    fun requireMetadataIdForUpdate_rejectsMissingId() {
        try {
            RecordMapper.requireMetadataIdForUpdate(JSONObject().put("recordType", "Steps"))
            throw AssertionError("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("metadata.id"))
        }
    }

    @Test
    fun parseZoneOffset_parsesOffsetOrNull() {
        assertEquals(java.time.ZoneOffset.of("+08:00"), RecordMapper.parseZoneOffset("+08:00"))
        assertEquals(java.time.ZoneOffset.UTC, RecordMapper.parseZoneOffset("Z"))
        assertNull(RecordMapper.parseZoneOffset(null))
        assertNull(RecordMapper.parseZoneOffset(""))
    }

    @Test
    fun jsonToSteps_mapsZoneOffsets() {
        val json =
            interval("Steps") {
                put("count", 1200)
                put("startZoneOffset", "+08:00")
                put("endZoneOffset", "+08:00")
            }
        val record = RecordMapper.jsonToRecord(json) as StepsRecord
        assertEquals(java.time.ZoneOffset.of("+08:00"), record.startZoneOffset)
        assertEquals(java.time.ZoneOffset.of("+08:00"), record.endZoneOffset)
    }

    @Test
    fun jsonToExerciseSession_mapsSegmentsAndLaps() {
        val json =
            interval("ExerciseSession") {
                put("exerciseType", 56)
                put(
                    "segments",
                    JSONArray().put(
                        JSONObject()
                            .put("startTime", START)
                            .put("endTime", "2024-01-01T08:30:00Z")
                            .put("segmentType", 46) // RUNNING segment
                            .put("repetitions", 0)
                    )
                )
                put(
                    "laps",
                    JSONArray().put(
                        JSONObject()
                            .put("startTime", START)
                            .put("endTime", "2024-01-01T08:20:00Z")
                            .put("length", 400.0)
                    )
                )
            }
        val record = RecordMapper.jsonToRecord(json) as ExerciseSessionRecord
        assertEquals(1, record.segments.size)
        assertEquals(46, record.segments[0].segmentType)
        assertEquals(1, record.laps.size)
        assertEquals(400.0, record.laps[0].length?.inMeters ?: -1.0, 0.001)

        val out = RecordMapper.recordToJson(record)
        assertEquals(1, out.getJSONArray("segments").length())
        assertEquals(46, out.getJSONArray("segments").getJSONObject(0).getInt("segmentType"))
        assertEquals(400.0, out.getJSONArray("laps").getJSONObject(0).getDouble("length"), 0.001)
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
            val message = requireNotNull(e.message) { "expected exception message" }
            assertTrue(message.contains("Unsupported record type"))
        }
    }

    @Test
    fun jsonToExerciseSession_mapsRouteWithOptionalLengths() {
        val json =
            interval("ExerciseSession") {
                put("exerciseType", 56)
                put(
                    "exerciseRoute",
                    JSONObject().put(
                        "route",
                        JSONArray()
                            .put(
                                JSONObject()
                                    .put("time", START)
                                    .put("latitude", 51.5)
                                    .put("longitude", -0.12)
                                    .put("altitude", 19.0)
                                    .put("horizontalAccuracy", 2.0)
                                // verticalAccuracy omitted — must stay null (matinzd #275)
                            )
                            .put(
                                JSONObject()
                                    // End time is exclusive on the session — stay inside range.
                                    .put("time", "2024-01-01T08:59:59Z")
                                    .put("latitude", 51.51)
                                    .put("longitude", -0.11)
                            )
                    )
                )
            }

        val record = RecordMapper.jsonToRecord(json) as ExerciseSessionRecord
        val result = record.exerciseRouteResult
        assertTrue(
            "expected Data, got ${result::class.java.simpleName}",
            result is ExerciseRouteResult.Data
        )
        val route = (result as ExerciseRouteResult.Data).exerciseRoute
        assertEquals(2, route.route.size)

        val first = route.route[0]
        assertEquals(19.0, first.altitude?.inMeters ?: -1.0, 0.001)
        assertEquals(2.0, first.horizontalAccuracy?.inMeters ?: -1.0, 0.001)
        assertNull(first.verticalAccuracy)

        val second = route.route[1]
        assertNull(second.altitude)
        assertNull(second.horizontalAccuracy)
        assertNull(second.verticalAccuracy)
    }

    @Test
    fun jsonToExerciseSession_mapsImprovementsFields() {
        val json =
            interval("ExerciseSession") {
                put("exerciseType", 56)
                put("plannedExerciseSessionId", "planned-abc")
                put("rateOfPerceivedExertion", 6.5)
            }

        val record = RecordMapper.jsonToRecord(json) as ExerciseSessionRecord
        assertEquals("planned-abc", record.plannedExerciseSessionId)
        assertEquals(6.5f, record.rateOfPerceivedExertion ?: -1f, 0.001f)

        val out = RecordMapper.recordToJson(record)
        assertEquals("planned-abc", out.getString("plannedExerciseSessionId"))
        assertEquals(6.5, out.getDouble("rateOfPerceivedExertion"), 0.001)
    }

    @Test
    fun exerciseRouteDataToJson_includesLengthResults() {
        val route =
            ExerciseRoute(
                listOf(
                    ExerciseRoute.Location(
                        time = java.time.Instant.parse(START),
                        latitude = 1.0,
                        longitude = 2.0,
                        altitude = Length.meters(10.0),
                    )
                )
            )
        val json = RecordMapper.exerciseRouteDataToJson(route)
        assertEquals("DATA", json.getString("type"))
        val loc = json.getJSONArray("route").getJSONObject(0)
        assertEquals(1.0, loc.getDouble("latitude"), 0.0)
        assertNotNull(loc.getJSONObject("altitude"))
        assertEquals(10.0, loc.getJSONObject("altitude").getDouble("inMeters"), 0.0)
        assertTrue(loc.isNull("horizontalAccuracy"))
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
