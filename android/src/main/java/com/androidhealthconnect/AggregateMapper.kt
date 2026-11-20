package com.androidhealthconnect

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.aggregate.AggregateMetric
import androidx.health.connect.client.aggregate.AggregationResult
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ActivityIntensityRecord
import androidx.health.connect.client.records.BloodPressureRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ElevationGainedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.FloorsClimbedRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.HeightRecord
import androidx.health.connect.client.records.HydrationRecord
import androidx.health.connect.client.records.MindfulnessSessionRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.DataOrigin
import androidx.health.connect.client.request.AggregateGroupByDurationRequest
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Length
import androidx.health.connect.client.units.Mass
import androidx.health.connect.client.units.Pressure
import androidx.health.connect.client.units.Volume
import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.LocalDateTime
import java.time.Period
import java.time.ZoneId

/**
 * Health Connect aggregate helpers.
 *
 * Duration buckets always use [Instant] time ranges to avoid Android 14+ UTC
 * wall-clock shift bugs (matinzd/react-native-health-connect#278 / #279).
 * Period buckets use [LocalDateTime] per official Health Connect docs.
 */
internal object AggregateMapper {

  private data class MetricSpec(
    val name: String,
    val metric: AggregateMetric<*>,
    val read: (AggregationResult) -> Any?,
  )

  suspend fun aggregate(client: HealthConnectClient, options: JSONObject): JSONObject {
    val recordType = options.getString("recordType")
    val specs = specsFor(recordType)
    val result =
      client.aggregate(
        AggregateRequest(
          metrics = specs.map { it.metric }.toSet(),
          timeRangeFilter = parseInstantTimeRange(options),
          dataOriginFilter = parseDataOriginFilter(options),
        )
      )
    return resultToJson(recordType, result, specs)
  }

  suspend fun aggregateGroupByDuration(
    client: HealthConnectClient,
    options: JSONObject,
  ): JSONArray {
    val recordType = options.getString("recordType")
    val specs = specsFor(recordType)
    val rows =
      client.aggregateGroupByDuration(
        AggregateGroupByDurationRequest(
          metrics = specs.map { it.metric }.toSet(),
          timeRangeFilter = parseInstantTimeRange(options),
          timeRangeSlicer = parseDurationSlicer(options),
          dataOriginFilter = parseDataOriginFilter(options),
        )
      )
    val out = JSONArray()
    rows.forEach { row ->
      out.put(
        JSONObject().apply {
          put("startTime", row.startTime.toString())
          put("endTime", row.endTime.toString())
          put("zoneOffset", row.zoneOffset?.toString() ?: JSONObject.NULL)
          put("result", resultToJson(recordType, row.result, specs))
        }
      )
    }
    return out
  }

  suspend fun aggregateGroupByPeriod(
    client: HealthConnectClient,
    options: JSONObject,
  ): JSONArray {
    val recordType = options.getString("recordType")
    val specs = specsFor(recordType)
    val rows =
      client.aggregateGroupByPeriod(
        AggregateGroupByPeriodRequest(
          metrics = specs.map { it.metric }.toSet(),
          timeRangeFilter = parseLocalDateTimeRange(options),
          timeRangeSlicer = parsePeriodSlicer(options),
          dataOriginFilter = parseDataOriginFilter(options),
        )
      )
    val out = JSONArray()
    rows.forEach { row ->
      out.put(
        JSONObject().apply {
          put("startTime", row.startTime.toString())
          put("endTime", row.endTime.toString())
          put("result", resultToJson(recordType, row.result, specs))
        }
      )
    }
    return out
  }

  fun supportedRecordTypes(): Set<String> =
    setOf(
      "Steps",
      "Distance",
      "ActiveCaloriesBurned",
      "TotalCaloriesBurned",
      "HeartRate",
      "RestingHeartRate",
      "Weight",
      "Height",
      "Hydration",
      "FloorsClimbed",
      "ElevationGained",
      "ExerciseSession",
      "SleepSession",
      "BloodPressure",
      "MindfulnessSession",
      "ActivityIntensity",
    )

  private fun specsFor(recordType: String): List<MetricSpec> =
    when (recordType) {
      "Steps" ->
        listOf(MetricSpec("COUNT_TOTAL", StepsRecord.COUNT_TOTAL) { it[StepsRecord.COUNT_TOTAL] })
      "Distance" ->
        listOf(
          MetricSpec("DISTANCE_TOTAL", DistanceRecord.DISTANCE_TOTAL) {
            it[DistanceRecord.DISTANCE_TOTAL]?.let(::lengthJson)
          }
        )
      "ActiveCaloriesBurned" ->
        listOf(
          MetricSpec(
            "ACTIVE_CALORIES_TOTAL",
            ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL,
          ) { it[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.let(::energyJson) }
        )
      "TotalCaloriesBurned" ->
        listOf(
          MetricSpec("ENERGY_TOTAL", TotalCaloriesBurnedRecord.ENERGY_TOTAL) {
            it[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.let(::energyJson)
          }
        )
      "HeartRate" ->
        listOf(
          MetricSpec("BPM_AVG", HeartRateRecord.BPM_AVG) { it[HeartRateRecord.BPM_AVG] },
          MetricSpec("BPM_MIN", HeartRateRecord.BPM_MIN) { it[HeartRateRecord.BPM_MIN] },
          MetricSpec("BPM_MAX", HeartRateRecord.BPM_MAX) { it[HeartRateRecord.BPM_MAX] },
          MetricSpec("MEASUREMENTS_COUNT", HeartRateRecord.MEASUREMENTS_COUNT) {
            it[HeartRateRecord.MEASUREMENTS_COUNT]
          },
        )
      "RestingHeartRate" ->
        listOf(
          MetricSpec("BPM_AVG", RestingHeartRateRecord.BPM_AVG) {
            it[RestingHeartRateRecord.BPM_AVG]
          },
          MetricSpec("BPM_MIN", RestingHeartRateRecord.BPM_MIN) {
            it[RestingHeartRateRecord.BPM_MIN]
          },
          MetricSpec("BPM_MAX", RestingHeartRateRecord.BPM_MAX) {
            it[RestingHeartRateRecord.BPM_MAX]
          },
        )
      "Weight" ->
        listOf(
          MetricSpec("WEIGHT_AVG", WeightRecord.WEIGHT_AVG) {
            it[WeightRecord.WEIGHT_AVG]?.let(::massJson)
          },
          MetricSpec("WEIGHT_MIN", WeightRecord.WEIGHT_MIN) {
            it[WeightRecord.WEIGHT_MIN]?.let(::massJson)
          },
          MetricSpec("WEIGHT_MAX", WeightRecord.WEIGHT_MAX) {
            it[WeightRecord.WEIGHT_MAX]?.let(::massJson)
          },
        )
      "Height" ->
        listOf(
          MetricSpec("HEIGHT_AVG", HeightRecord.HEIGHT_AVG) {
            it[HeightRecord.HEIGHT_AVG]?.let(::lengthJson)
          },
          MetricSpec("HEIGHT_MIN", HeightRecord.HEIGHT_MIN) {
            it[HeightRecord.HEIGHT_MIN]?.let(::lengthJson)
          },
          MetricSpec("HEIGHT_MAX", HeightRecord.HEIGHT_MAX) {
            it[HeightRecord.HEIGHT_MAX]?.let(::lengthJson)
          },
        )
      "Hydration" ->
        listOf(
          MetricSpec("VOLUME_TOTAL", HydrationRecord.VOLUME_TOTAL) {
            it[HydrationRecord.VOLUME_TOTAL]?.let(::volumeJson)
          }
        )
      "FloorsClimbed" ->
        listOf(
          MetricSpec("FLOORS_CLIMBED_TOTAL", FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL) {
            it[FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL]
          }
        )
      "ElevationGained" ->
        listOf(
          MetricSpec("ELEVATION_GAINED_TOTAL", ElevationGainedRecord.ELEVATION_GAINED_TOTAL) {
            it[ElevationGainedRecord.ELEVATION_GAINED_TOTAL]?.let(::lengthJson)
          }
        )
      "ExerciseSession" ->
        listOf(
          MetricSpec("EXERCISE_DURATION_TOTAL", ExerciseSessionRecord.EXERCISE_DURATION_TOTAL) {
            it[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.let { d ->
              JSONObject().put("inSeconds", d.seconds)
            }
          }
        )
      "SleepSession" ->
        listOf(
          MetricSpec("SLEEP_DURATION_TOTAL", SleepSessionRecord.SLEEP_DURATION_TOTAL) {
            it[SleepSessionRecord.SLEEP_DURATION_TOTAL]?.let { d ->
              JSONObject().put("inSeconds", d.seconds)
            }
          }
        )
      "BloodPressure" ->
        listOf(
          MetricSpec("SYSTOLIC_AVG", BloodPressureRecord.SYSTOLIC_AVG) {
            it[BloodPressureRecord.SYSTOLIC_AVG]?.let(::pressureJson)
          },
          MetricSpec("SYSTOLIC_MIN", BloodPressureRecord.SYSTOLIC_MIN) {
            it[BloodPressureRecord.SYSTOLIC_MIN]?.let(::pressureJson)
          },
          MetricSpec("SYSTOLIC_MAX", BloodPressureRecord.SYSTOLIC_MAX) {
            it[BloodPressureRecord.SYSTOLIC_MAX]?.let(::pressureJson)
          },
          MetricSpec("DIASTOLIC_AVG", BloodPressureRecord.DIASTOLIC_AVG) {
            it[BloodPressureRecord.DIASTOLIC_AVG]?.let(::pressureJson)
          },
          MetricSpec("DIASTOLIC_MIN", BloodPressureRecord.DIASTOLIC_MIN) {
            it[BloodPressureRecord.DIASTOLIC_MIN]?.let(::pressureJson)
          },
          MetricSpec("DIASTOLIC_MAX", BloodPressureRecord.DIASTOLIC_MAX) {
            it[BloodPressureRecord.DIASTOLIC_MAX]?.let(::pressureJson)
          },
        )
      "MindfulnessSession" ->
        listOf(
          MetricSpec(
            "MINDFULNESS_DURATION_TOTAL",
            MindfulnessSessionRecord.MINDFULNESS_DURATION_TOTAL,
          ) {
            it[MindfulnessSessionRecord.MINDFULNESS_DURATION_TOTAL]?.let { d ->
              JSONObject().put("inSeconds", d.seconds)
            }
          }
        )
      "ActivityIntensity" ->
        listOf(
          MetricSpec("DURATION_TOTAL", ActivityIntensityRecord.DURATION_TOTAL) {
            it[ActivityIntensityRecord.DURATION_TOTAL]?.let { d ->
              JSONObject().put("inSeconds", d.seconds)
            }
          },
          MetricSpec("MODERATE_DURATION_TOTAL", ActivityIntensityRecord.MODERATE_DURATION_TOTAL) {
            it[ActivityIntensityRecord.MODERATE_DURATION_TOTAL]?.let { d ->
              JSONObject().put("inSeconds", d.seconds)
            }
          },
          MetricSpec("VIGOROUS_DURATION_TOTAL", ActivityIntensityRecord.VIGOROUS_DURATION_TOTAL) {
            it[ActivityIntensityRecord.VIGOROUS_DURATION_TOTAL]?.let { d ->
              JSONObject().put("inSeconds", d.seconds)
            }
          },
        )
      else ->
        throw IllegalArgumentException("Aggregation not supported for recordType=$recordType")
    }

  private fun resultToJson(
    recordType: String,
    result: AggregationResult,
    specs: List<MetricSpec>,
  ): JSONObject =
    JSONObject().apply {
      put("recordType", recordType)
      put("dataOrigins", JSONArray(result.dataOrigins.map { it.packageName }))
      val metrics = JSONObject()
      specs.forEach { spec ->
        metrics.put(spec.name, spec.read(result) ?: JSONObject.NULL)
      }
      put("metrics", metrics)
    }

  private fun parseInstantTimeRange(options: JSONObject): TimeRangeFilter {
    val filter = options.getJSONObject("timeRangeFilter")
    return TimeRangeFilter.between(
      Instant.parse(filter.getString("startTime")),
      Instant.parse(filter.getString("endTime")),
    )
  }

  private fun parseLocalDateTimeRange(options: JSONObject): TimeRangeFilter {
    val filter = options.getJSONObject("timeRangeFilter")
    val zone = ZoneId.systemDefault()
    val start = LocalDateTime.ofInstant(Instant.parse(filter.getString("startTime")), zone)
    val end = LocalDateTime.ofInstant(Instant.parse(filter.getString("endTime")), zone)
    return TimeRangeFilter.between(start, end)
  }

  private fun parseDataOriginFilter(options: JSONObject): Set<DataOrigin> {
    val arr = options.optJSONArray("dataOriginFilter") ?: return emptySet()
    return (0 until arr.length()).map { DataOrigin(arr.getString(it)) }.toSet()
  }

  private fun parseDurationSlicer(options: JSONObject): Duration {
    val slicer = options.getJSONObject("timeRangeSlicer")
    val value = slicer.getLong("value")
    return when (slicer.getString("unit")) {
      "millis" -> Duration.ofMillis(value)
      "seconds" -> Duration.ofSeconds(value)
      "minutes" -> Duration.ofMinutes(value)
      "hours" -> Duration.ofHours(value)
      "days" -> Duration.ofDays(value)
      else -> throw IllegalArgumentException("Unsupported duration unit")
    }
  }

  private fun parsePeriodSlicer(options: JSONObject): Period {
    val slicer = options.getJSONObject("timeRangeSlicer")
    val value = slicer.getInt("value")
    return when (slicer.getString("unit")) {
      "days" -> Period.ofDays(value)
      "weeks" -> Period.ofWeeks(value)
      "months" -> Period.ofMonths(value)
      "years" -> Period.ofYears(value)
      else -> throw IllegalArgumentException("Unsupported period unit")
    }
  }

  private fun energyJson(e: Energy) =
    JSONObject()
      .put("inKilocalories", e.inKilocalories)
      .put("inCalories", e.inCalories)
      .put("inJoules", e.inJoules)

  private fun lengthJson(l: Length) =
    JSONObject()
      .put("inMeters", l.inMeters)
      .put("inKilometers", l.inKilometers)
      .put("inMiles", l.inMiles)

  private fun massJson(m: Mass) =
    JSONObject()
      .put("inKilograms", m.inKilograms)
      .put("inGrams", m.inGrams)
      .put("inPounds", m.inPounds)

  private fun volumeJson(v: Volume) =
    JSONObject()
      .put("inLiters", v.inLiters)
      .put("inMilliliters", v.inMilliliters)

  private fun pressureJson(p: Pressure) =
    JSONObject().put("inMillimetersOfMercury", p.inMillimetersOfMercury)
}
