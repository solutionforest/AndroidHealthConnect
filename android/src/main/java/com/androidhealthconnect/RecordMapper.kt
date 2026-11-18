package com.androidhealthconnect

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.*
import androidx.health.connect.client.records.metadata.DataOrigin
import androidx.health.connect.client.records.metadata.Metadata as HealthMetadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.*
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.time.ZoneOffset

// ─── Top-level dispatcher ─────────────────────────────────────────────────────

internal object RecordMapper {

    // ── Read ─────────────────────────────────────────────────────────────────

    suspend fun readRecords(
        client: HealthConnectClient,
        recordType: String,
        options: JSONObject,
    ): JSONObject {
        val timeRangeFilter = parseTimeRangeFilter(options)
        val ascendingOrder = options.optBoolean("ascendingOrder", true)
        val pageSize = options.optInt("pageSize", 1000)
        val rawToken = options.optString("pageToken", "")
        val pageToken = rawToken.ifEmpty { null }
        val dataOriginFilter = parseDataOriginFilter(options)

        return when (recordType) {
            "Steps" -> {
                val req = ReadRecordsRequest(
                    StepsRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::stepsToJson) }
            }

            "HeartRate" -> {
                val req = ReadRecordsRequest(
                    HeartRateRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::heartRateToJson) }
            }

            "SleepSession" -> {
                val req = ReadRecordsRequest(
                    SleepSessionRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::sleepSessionToJson) }
            }

            "ActiveCaloriesBurned" -> {
                val req = ReadRecordsRequest(
                    ActiveCaloriesBurnedRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::activeCaloriesToJson) }
            }

            "TotalCaloriesBurned" -> {
                val req = ReadRecordsRequest(
                    TotalCaloriesBurnedRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::totalCaloriesToJson) }
            }

            "Distance" -> {
                val req = ReadRecordsRequest(
                    DistanceRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::distanceToJson) }
            }

            "Weight" -> {
                val req = ReadRecordsRequest(
                    WeightRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::weightToJson) }
            }

            "Height" -> {
                val req = ReadRecordsRequest(
                    HeightRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::heightToJson) }
            }

            "BloodPressure" -> {
                val req = ReadRecordsRequest(
                    BloodPressureRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::bloodPressureToJson) }
            }

            "BloodGlucose" -> {
                val req = ReadRecordsRequest(
                    BloodGlucoseRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::bloodGlucoseToJson) }
            }

            "OxygenSaturation" -> {
                val req = ReadRecordsRequest(
                    OxygenSaturationRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::oxygenSaturationToJson) }
            }

            "BodyTemperature" -> {
                val req = ReadRecordsRequest(
                    BodyTemperatureRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::bodyTemperatureToJson) }
            }

            "BodyFat" -> {
                val req = ReadRecordsRequest(
                    BodyFatRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::bodyFatToJson) }
            }

            "Hydration" -> {
                val req = ReadRecordsRequest(
                    HydrationRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::hydrationToJson) }
            }

            "ExerciseSession" -> {
                val req = ReadRecordsRequest(
                    ExerciseSessionRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::exerciseSessionToJson) }
            }

            "RestingHeartRate" -> {
                val req = ReadRecordsRequest(
                    RestingHeartRateRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::restingHeartRateToJson) }
            }

            "RespiratoryRate" -> {
                val req = ReadRecordsRequest(
                    RespiratoryRateRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::respiratoryRateToJson) }
            }

            "FloorsClimbed" -> {
                val req = ReadRecordsRequest(
                    FloorsClimbedRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::floorsClimbedToJson) }
            }

            "ElevationGained" -> {
                val req = ReadRecordsRequest(
                    ElevationGainedRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::elevationGainedToJson) }
            }

            "MindfulnessSession" -> {
                val req = ReadRecordsRequest(
                    MindfulnessSessionRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::mindfulnessSessionToJson) }
            }

            "SkinTemperature" -> {
                val req = ReadRecordsRequest(
                    SkinTemperatureRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::skinTemperatureToJson) }
            }

            "ActivityIntensity" -> {
                val req = ReadRecordsRequest(
                    ActivityIntensityRecord::class, timeRangeFilter, dataOriginFilter,
                    ascendingOrder, pageSize, pageToken
                )
                val res = client.readRecords(req)
                buildResponse(res.pageToken) { res.records.map(::activityIntensityToJson) }
            }

            else -> throw IllegalArgumentException("Unsupported record type: $recordType")
        }
    }

    // ── Write ────────────────────────────────────────────────────────────────

    fun jsonToRecord(json: JSONObject): Record {
        return when (val type = json.getString("recordType")) {
            "Steps" -> jsonToSteps(json)
            "HeartRate" -> jsonToHeartRate(json)
            "SleepSession" -> jsonToSleepSession(json)
            "ActiveCaloriesBurned" -> jsonToActiveCalories(json)
            "TotalCaloriesBurned" -> jsonToTotalCalories(json)
            "Distance" -> jsonToDistance(json)
            "Weight" -> jsonToWeight(json)
            "Height" -> jsonToHeight(json)
            "BloodPressure" -> jsonToBloodPressure(json)
            "BloodGlucose" -> jsonToBloodGlucose(json)
            "OxygenSaturation" -> jsonToOxygenSaturation(json)
            "BodyTemperature" -> jsonToBodyTemperature(json)
            "BodyFat" -> jsonToBodyFat(json)
            "Hydration" -> jsonToHydration(json)
            "ExerciseSession" -> jsonToExerciseSession(json)
            "RestingHeartRate" -> jsonToRestingHeartRate(json)
            "RespiratoryRate" -> jsonToRespiratoryRate(json)
            "FloorsClimbed" -> jsonToFloorsClimbed(json)
            "ElevationGained" -> jsonToElevationGained(json)
            "MindfulnessSession" -> jsonToMindfulnessSession(json)
            "SkinTemperature" -> jsonToSkinTemperature(json)
            "ActivityIntensity" -> jsonToActivityIntensity(json)
            else -> throw IllegalArgumentException("Unsupported record type: $type")
        }
    }

    // ── Delete by record type ─────────────────────────────────────────────────

    suspend fun deleteByTimeRange(
        client: HealthConnectClient,
        recordType: String,
        filter: TimeRangeFilter,
    ) {
        when (recordType) {
            "Steps" -> client.deleteRecords(StepsRecord::class, filter)
            "HeartRate" -> client.deleteRecords(HeartRateRecord::class, filter)
            "SleepSession" -> client.deleteRecords(SleepSessionRecord::class, filter)
            "ActiveCaloriesBurned" -> client.deleteRecords(ActiveCaloriesBurnedRecord::class, filter)
            "TotalCaloriesBurned" -> client.deleteRecords(TotalCaloriesBurnedRecord::class, filter)
            "Distance" -> client.deleteRecords(DistanceRecord::class, filter)
            "Weight" -> client.deleteRecords(WeightRecord::class, filter)
            "Height" -> client.deleteRecords(HeightRecord::class, filter)
            "BloodPressure" -> client.deleteRecords(BloodPressureRecord::class, filter)
            "BloodGlucose" -> client.deleteRecords(BloodGlucoseRecord::class, filter)
            "OxygenSaturation" -> client.deleteRecords(OxygenSaturationRecord::class, filter)
            "BodyTemperature" -> client.deleteRecords(BodyTemperatureRecord::class, filter)
            "BodyFat" -> client.deleteRecords(BodyFatRecord::class, filter)
            "Hydration" -> client.deleteRecords(HydrationRecord::class, filter)
            "ExerciseSession" -> client.deleteRecords(ExerciseSessionRecord::class, filter)
            "RestingHeartRate" -> client.deleteRecords(RestingHeartRateRecord::class, filter)
            "RespiratoryRate" -> client.deleteRecords(RespiratoryRateRecord::class, filter)
            "FloorsClimbed" -> client.deleteRecords(FloorsClimbedRecord::class, filter)
            "ElevationGained" -> client.deleteRecords(ElevationGainedRecord::class, filter)
            "MindfulnessSession" -> client.deleteRecords(MindfulnessSessionRecord::class, filter)
            "SkinTemperature" -> client.deleteRecords(SkinTemperatureRecord::class, filter)
            "ActivityIntensity" -> client.deleteRecords(ActivityIntensityRecord::class, filter)
            else -> throw IllegalArgumentException("Unsupported record type: $recordType")
        }
    }

    suspend fun deleteByIds(
        client: HealthConnectClient,
        recordType: String,
        ids: List<String>,
    ) {
        when (recordType) {
            "Steps" -> client.deleteRecords(StepsRecord::class, ids, emptyList())
            "HeartRate" -> client.deleteRecords(HeartRateRecord::class, ids, emptyList())
            "SleepSession" -> client.deleteRecords(SleepSessionRecord::class, ids, emptyList())
            "ActiveCaloriesBurned" -> client.deleteRecords(ActiveCaloriesBurnedRecord::class, ids, emptyList())
            "TotalCaloriesBurned" -> client.deleteRecords(TotalCaloriesBurnedRecord::class, ids, emptyList())
            "Distance" -> client.deleteRecords(DistanceRecord::class, ids, emptyList())
            "Weight" -> client.deleteRecords(WeightRecord::class, ids, emptyList())
            "Height" -> client.deleteRecords(HeightRecord::class, ids, emptyList())
            "BloodPressure" -> client.deleteRecords(BloodPressureRecord::class, ids, emptyList())
            "BloodGlucose" -> client.deleteRecords(BloodGlucoseRecord::class, ids, emptyList())
            "OxygenSaturation" -> client.deleteRecords(OxygenSaturationRecord::class, ids, emptyList())
            "BodyTemperature" -> client.deleteRecords(BodyTemperatureRecord::class, ids, emptyList())
            "BodyFat" -> client.deleteRecords(BodyFatRecord::class, ids, emptyList())
            "Hydration" -> client.deleteRecords(HydrationRecord::class, ids, emptyList())
            "ExerciseSession" -> client.deleteRecords(ExerciseSessionRecord::class, ids, emptyList())
            "RestingHeartRate" -> client.deleteRecords(RestingHeartRateRecord::class, ids, emptyList())
            "RespiratoryRate" -> client.deleteRecords(RespiratoryRateRecord::class, ids, emptyList())
            "FloorsClimbed" -> client.deleteRecords(FloorsClimbedRecord::class, ids, emptyList())
            "ElevationGained" -> client.deleteRecords(ElevationGainedRecord::class, ids, emptyList())
            "MindfulnessSession" -> client.deleteRecords(MindfulnessSessionRecord::class, ids, emptyList())
            "SkinTemperature" -> client.deleteRecords(SkinTemperatureRecord::class, ids, emptyList())
            "ActivityIntensity" -> client.deleteRecords(ActivityIntensityRecord::class, ids, emptyList())
            else -> throw IllegalArgumentException("Unsupported record type: $recordType")
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private fun buildResponse(pageToken: String?, records: () -> List<JSONObject>): JSONObject {
        return JSONObject().apply {
            put("records", JSONArray(records()))
            put("pageToken", pageToken ?: JSONObject.NULL)
        }
    }

    private fun parseTimeRangeFilter(options: JSONObject): TimeRangeFilter {
        val filter = options.optJSONObject("timeRangeFilter")
        return if (filter != null) {
            TimeRangeFilter.between(
                Instant.parse(filter.getString("startTime")),
                Instant.parse(filter.getString("endTime"))
            )
        } else {
            // Default: last 30 days
            val now = Instant.now()
            TimeRangeFilter.between(now.minusSeconds(30L * 24 * 3600), now)
        }
    }

    private fun parseDataOriginFilter(options: JSONObject): Set<DataOrigin> {
        val arr = options.optJSONArray("dataOriginFilter") ?: return emptySet()
        return (0 until arr.length()).map { DataOrigin(arr.getString(it)) }.toSet()
    }

    private fun parseInstant(json: JSONObject, key: String): Instant =
        Instant.parse(json.getString(key))

    private fun parseZoneOffset(value: String?): ZoneOffset? =
        if (value.isNullOrEmpty()) null else ZoneOffset.of(value)

    private fun metadataToJson(meta: HealthMetadata): JSONObject =
        JSONObject().apply {
            put("id", meta.id)
            put("clientRecordId", meta.clientRecordId ?: JSONObject.NULL)
            put("clientRecordVersion", meta.clientRecordVersion)
            put("lastModifiedTime", meta.lastModifiedTime.toString())
            put("dataOrigin", meta.dataOrigin.packageName)
            put("recordingMethod", meta.recordingMethod)
        }

    private fun jsonToMetadata(json: JSONObject?): HealthMetadata {
        val clientRecordId = json?.optString("clientRecordId")?.ifEmpty { null }
        return if (clientRecordId != null) {
            HealthMetadata.manualEntry(clientRecordId = clientRecordId)
        } else {
            HealthMetadata.manualEntry()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Record → JSON conversions
    // ─────────────────────────────────────────────────────────────────────────

    private fun stepsToJson(r: StepsRecord) = JSONObject().apply {
        put("recordType", "Steps")
        put("count", r.count)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun heartRateToJson(r: HeartRateRecord) = JSONObject().apply {
        put("recordType", "HeartRate")
        val samples = JSONArray()
        r.samples.forEach { s ->
            samples.put(JSONObject().apply {
                put("time", s.time.toString())
                put("beatsPerMinute", s.beatsPerMinute)
            })
        }
        put("samples", samples)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun sleepSessionToJson(r: SleepSessionRecord) = JSONObject().apply {
        put("recordType", "SleepSession")
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        put("title", r.title ?: JSONObject.NULL)
        put("notes", r.notes ?: JSONObject.NULL)
        val stages = JSONArray()
        r.stages.forEach { s ->
            stages.put(JSONObject().apply {
                put("startTime", s.startTime.toString())
                put("endTime", s.endTime.toString())
                put("stage", s.stage)
            })
        }
        put("stages", stages)
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun activeCaloriesToJson(r: ActiveCaloriesBurnedRecord) = JSONObject().apply {
        put("recordType", "ActiveCaloriesBurned")
        put("energy", r.energy.inKilocalories)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun totalCaloriesToJson(r: TotalCaloriesBurnedRecord) = JSONObject().apply {
        put("recordType", "TotalCaloriesBurned")
        put("energy", r.energy.inKilocalories)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun distanceToJson(r: DistanceRecord) = JSONObject().apply {
        put("recordType", "Distance")
        put("distance", r.distance.inMeters)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun weightToJson(r: WeightRecord) = JSONObject().apply {
        put("recordType", "Weight")
        put("weight", r.weight.inKilograms)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun heightToJson(r: HeightRecord) = JSONObject().apply {
        put("recordType", "Height")
        put("height", r.height.inMeters)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun bloodPressureToJson(r: BloodPressureRecord) = JSONObject().apply {
        put("recordType", "BloodPressure")
        put("systolic", r.systolic.inMillimetersOfMercury)
        put("diastolic", r.diastolic.inMillimetersOfMercury)
        put("bodyPosition", r.bodyPosition)
        put("measurementLocation", r.measurementLocation)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun bloodGlucoseToJson(r: BloodGlucoseRecord) = JSONObject().apply {
        put("recordType", "BloodGlucose")
        put("level", r.level.inMillimolesPerLiter)
        put("specimenSource", r.specimenSource)
        put("mealType", r.mealType)
        put("relationToMeal", r.relationToMeal)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun oxygenSaturationToJson(r: OxygenSaturationRecord) = JSONObject().apply {
        put("recordType", "OxygenSaturation")
        put("percentage", r.percentage.value)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun bodyTemperatureToJson(r: BodyTemperatureRecord) = JSONObject().apply {
        put("recordType", "BodyTemperature")
        put("temperature", r.temperature.inCelsius)
        put("measurementLocation", r.measurementLocation)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun bodyFatToJson(r: BodyFatRecord) = JSONObject().apply {
        put("recordType", "BodyFat")
        put("percentage", r.percentage.value)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun hydrationToJson(r: HydrationRecord) = JSONObject().apply {
        put("recordType", "Hydration")
        put("volume", r.volume.inLiters)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun exerciseSessionToJson(r: ExerciseSessionRecord) = JSONObject().apply {
        put("recordType", "ExerciseSession")
        put("exerciseType", r.exerciseType)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        put("title", r.title ?: JSONObject.NULL)
        put("notes", r.notes ?: JSONObject.NULL)
        val segments = JSONArray()
        r.segments.forEach { s ->
            segments.put(JSONObject().apply {
                put("startTime", s.startTime.toString())
                put("endTime", s.endTime.toString())
                put("segmentType", s.segmentType)
                put("repetitions", s.repetitions)
            })
        }
        put("segments", segments)
        val laps = JSONArray()
        r.laps.forEach { l ->
            laps.put(JSONObject().apply {
                put("startTime", l.startTime.toString())
                put("endTime", l.endTime.toString())
                put("length", l.length?.inMeters ?: JSONObject.NULL)
            })
        }
        put("laps", laps)
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun restingHeartRateToJson(r: RestingHeartRateRecord) = JSONObject().apply {
        put("recordType", "RestingHeartRate")
        put("beatsPerMinute", r.beatsPerMinute)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun respiratoryRateToJson(r: RespiratoryRateRecord) = JSONObject().apply {
        put("recordType", "RespiratoryRate")
        put("rate", r.rate)
        put("time", r.time.toString())
        r.zoneOffset?.let { put("zoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun floorsClimbedToJson(r: FloorsClimbedRecord) = JSONObject().apply {
        put("recordType", "FloorsClimbed")
        put("floors", r.floors)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun elevationGainedToJson(r: ElevationGainedRecord) = JSONObject().apply {
        put("recordType", "ElevationGained")
        put("elevation", r.elevation.inMeters)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun mindfulnessSessionToJson(r: MindfulnessSessionRecord) = JSONObject().apply {
        put("recordType", "MindfulnessSession")
        put("mindfulnessSessionType", r.mindfulnessSessionType)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        put("title", r.title ?: JSONObject.NULL)
        put("notes", r.notes ?: JSONObject.NULL)
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun skinTemperatureToJson(r: SkinTemperatureRecord) = JSONObject().apply {
        put("recordType", "SkinTemperature")
        val deltas = JSONArray()
        r.deltas.forEach { d ->
            deltas.put(JSONObject().apply {
                put("time", d.time.toString())
                put("delta", d.delta.inCelsius)
            })
        }
        put("deltas", deltas)
        put("baseline", r.baseline?.inCelsius ?: JSONObject.NULL)
        put("measurementLocation", r.measurementLocation)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    private fun activityIntensityToJson(r: ActivityIntensityRecord) = JSONObject().apply {
        put("recordType", "ActivityIntensity")
        put("activityIntensityType", r.activityIntensityType)
        put("startTime", r.startTime.toString())
        put("endTime", r.endTime.toString())
        r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
        r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
        put("metadata", metadataToJson(r.metadata))
    }

    // ─────────────────────────────────────────────────────────────────────────
    // JSON → Record conversions
    // ─────────────────────────────────────────────────────────────────────────

    private fun jsonToSteps(j: JSONObject) = StepsRecord(
        count = j.getLong("count"),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToHeartRate(j: JSONObject): HeartRateRecord {
        val samplesArr = j.getJSONArray("samples")
        val samples = (0 until samplesArr.length()).map { i ->
            val s = samplesArr.getJSONObject(i)
            HeartRateRecord.Sample(
                time = Instant.parse(s.getString("time")),
                beatsPerMinute = s.getLong("beatsPerMinute")
            )
        }
        return HeartRateRecord(
            samples = samples,
            startTime = parseInstant(j, "startTime"),
            endTime = parseInstant(j, "endTime"),
            startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
            endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
            metadata = jsonToMetadata(j.optJSONObject("metadata"))
        )
    }

    private fun jsonToSleepSession(j: JSONObject): SleepSessionRecord {
        val stagesArr = j.optJSONArray("stages")
        val stages = if (stagesArr != null) {
            (0 until stagesArr.length()).map { i ->
                val s = stagesArr.getJSONObject(i)
                SleepSessionRecord.Stage(
                    startTime = Instant.parse(s.getString("startTime")),
                    endTime = Instant.parse(s.getString("endTime")),
                    stage = s.getInt("stage")
                )
            }
        } else emptyList()
        return SleepSessionRecord(
            startTime = parseInstant(j, "startTime"),
            endTime = parseInstant(j, "endTime"),
            title = j.optString("title").ifEmpty { null },
            notes = j.optString("notes").ifEmpty { null },
            stages = stages,
            startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
            endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
            metadata = jsonToMetadata(j.optJSONObject("metadata"))
        )
    }

    private fun jsonToActiveCalories(j: JSONObject) = ActiveCaloriesBurnedRecord(
        energy = Energy.kilocalories(j.getDouble("energy")),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToTotalCalories(j: JSONObject) = TotalCaloriesBurnedRecord(
        energy = Energy.kilocalories(j.getDouble("energy")),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToDistance(j: JSONObject) = DistanceRecord(
        distance = Length.meters(j.getDouble("distance")),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToWeight(j: JSONObject) = WeightRecord(
        weight = Mass.kilograms(j.getDouble("weight")),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToHeight(j: JSONObject) = HeightRecord(
        height = Length.meters(j.getDouble("height")),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToBloodPressure(j: JSONObject) = BloodPressureRecord(
        systolic = Pressure.millimetersOfMercury(j.getDouble("systolic")),
        diastolic = Pressure.millimetersOfMercury(j.getDouble("diastolic")),
        bodyPosition = j.optInt("bodyPosition", BloodPressureRecord.BODY_POSITION_UNKNOWN),
        measurementLocation = j.optInt(
            "measurementLocation",
            BloodPressureRecord.MEASUREMENT_LOCATION_UNKNOWN
        ),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToBloodGlucose(j: JSONObject) = BloodGlucoseRecord(
        level = BloodGlucose.millimolesPerLiter(j.getDouble("level")),
        specimenSource = j.optInt("specimenSource", BloodGlucoseRecord.SPECIMEN_SOURCE_UNKNOWN),
        mealType = j.optInt("mealType", MealType.MEAL_TYPE_UNKNOWN),
        relationToMeal = j.optInt("relationToMeal", BloodGlucoseRecord.RELATION_TO_MEAL_UNKNOWN),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToOxygenSaturation(j: JSONObject) = OxygenSaturationRecord(
        percentage = Percentage(j.getDouble("percentage")),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToBodyTemperature(j: JSONObject) = BodyTemperatureRecord(
        temperature = Temperature.celsius(j.getDouble("temperature")),
        measurementLocation = j.optInt("measurementLocation", 0),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToBodyFat(j: JSONObject) = BodyFatRecord(
        percentage = Percentage(j.getDouble("percentage")),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToHydration(j: JSONObject) = HydrationRecord(
        volume = Volume.liters(j.getDouble("volume")),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToExerciseSession(j: JSONObject): ExerciseSessionRecord {
        val segArr = j.optJSONArray("segments")
        val segments = if (segArr != null) {
            (0 until segArr.length()).map { i ->
                val s = segArr.getJSONObject(i)
                ExerciseSegment(
                    startTime = Instant.parse(s.getString("startTime")),
                    endTime = Instant.parse(s.getString("endTime")),
                    segmentType = s.getInt("segmentType"),
                    repetitions = s.optInt("repetitions", 0)
                )
            }
        } else emptyList()

        val lapArr = j.optJSONArray("laps")
        val laps = if (lapArr != null) {
            (0 until lapArr.length()).map { i ->
                val l = lapArr.getJSONObject(i)
                ExerciseLap(
                    startTime = Instant.parse(l.getString("startTime")),
                    endTime = Instant.parse(l.getString("endTime")),
                    length = if (l.isNull("length")) null else Length.meters(l.getDouble("length"))
                )
            }
        } else emptyList()

        return ExerciseSessionRecord(
            exerciseType = j.getInt("exerciseType"),
            startTime = parseInstant(j, "startTime"),
            endTime = parseInstant(j, "endTime"),
            title = j.optString("title").ifEmpty { null },
            notes = j.optString("notes").ifEmpty { null },
            segments = segments,
            laps = laps,
            startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
            endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
            metadata = jsonToMetadata(j.optJSONObject("metadata"))
        )
    }

    private fun jsonToRestingHeartRate(j: JSONObject) = RestingHeartRateRecord(
        beatsPerMinute = j.getLong("beatsPerMinute"),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToRespiratoryRate(j: JSONObject) = RespiratoryRateRecord(
        rate = j.getDouble("rate"),
        time = parseInstant(j, "time"),
        zoneOffset = parseZoneOffset(j.optString("zoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToFloorsClimbed(j: JSONObject) = FloorsClimbedRecord(
        floors = j.getDouble("floors"),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToElevationGained(j: JSONObject) = ElevationGainedRecord(
        elevation = Length.meters(j.getDouble("elevation")),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToMindfulnessSession(j: JSONObject) = MindfulnessSessionRecord(
        mindfulnessSessionType = j.getInt("mindfulnessSessionType"),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        title = j.optString("title").ifEmpty { null },
        notes = j.optString("notes").ifEmpty { null },
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )

    private fun jsonToSkinTemperature(j: JSONObject): SkinTemperatureRecord {
        val deltasArr = j.getJSONArray("deltas")
        val deltas = (0 until deltasArr.length()).map { i ->
            val d = deltasArr.getJSONObject(i)
            SkinTemperatureRecord.Delta(
                time = Instant.parse(d.getString("time")),
                delta = TemperatureDelta.celsius(d.getDouble("delta"))
            )
        }
        val baseline = if (j.isNull("baseline") || !j.has("baseline")) null
        else Temperature.celsius(j.getDouble("baseline"))
        return SkinTemperatureRecord(
            deltas = deltas,
            baseline = baseline,
            measurementLocation = j.optInt(
                "measurementLocation",
                SkinTemperatureRecord.MEASUREMENT_LOCATION_UNKNOWN
            ),
            startTime = parseInstant(j, "startTime"),
            endTime = parseInstant(j, "endTime"),
            startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
            endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
            metadata = jsonToMetadata(j.optJSONObject("metadata"))
        )
    }

    private fun jsonToActivityIntensity(j: JSONObject) = ActivityIntensityRecord(
        activityIntensityType = j.getInt("activityIntensityType"),
        startTime = parseInstant(j, "startTime"),
        endTime = parseInstant(j, "endTime"),
        startZoneOffset = parseZoneOffset(j.optString("startZoneOffset")),
        endZoneOffset = parseZoneOffset(j.optString("endZoneOffset")),
        metadata = jsonToMetadata(j.optJSONObject("metadata"))
    )
}
