package com.androidhealthconnect

import androidx.health.connect.client.ExperimentalMatchmakingApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.feature.ExperimentalPersonalHealthRecordApi
import androidx.health.connect.client.records.*
import kotlin.reflect.KClass

@OptIn(ExperimentalMatchmakingApi::class, ExperimentalPersonalHealthRecordApi::class)
internal object FeatureSupport {

  fun statusToString(status: Int): String =
    when (status) {
      HealthConnectFeatures.FEATURE_STATUS_AVAILABLE -> "available"
      else -> "unavailable"
    }

  fun featureFromName(name: String): Int =
    when (name) {
      "activityIntensity" -> HealthConnectFeatures.FEATURE_ACTIVITY_INTENSITY
      "matchmaking" -> HealthConnectFeatures.FEATURE_MATCHMAKING
      "mindfulnessSession" -> HealthConnectFeatures.FEATURE_MINDFULNESS_SESSION
      "personalHealthRecord" -> HealthConnectFeatures.FEATURE_PERSONAL_HEALTH_RECORD
      "plannedExercise" -> HealthConnectFeatures.FEATURE_PLANNED_EXERCISE
      "readHealthDataHistory" -> HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_HISTORY
      "readHealthDataInBackground" ->
        HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND
      "skinTemperature" -> HealthConnectFeatures.FEATURE_SKIN_TEMPERATURE
      "extendedDeviceTypes" -> HealthConnectFeatures.FEATURE_EXTENDED_DEVICE_TYPES
      "exerciseSessionImprovements" ->
        HealthConnectFeatures.FEATURE_EXERCISE_SESSION_IMPROVEMENTS
      else -> throw IllegalArgumentException("Unknown Health Connect feature: $name")
    }

  fun getStatus(client: HealthConnectClient, featureName: String): String {
    val feature = featureFromName(featureName)
    return statusToString(client.features.getFeatureStatus(feature))
  }

  /** Maps JS recordType strings to HC Record KClasses for MatchmakingRequest. */
  fun recordClassForType(recordType: String): KClass<out Record> =
    when (recordType) {
      "Steps" -> StepsRecord::class
      "HeartRate" -> HeartRateRecord::class
      "SleepSession" -> SleepSessionRecord::class
      "ActiveCaloriesBurned" -> ActiveCaloriesBurnedRecord::class
      "TotalCaloriesBurned" -> TotalCaloriesBurnedRecord::class
      "Distance" -> DistanceRecord::class
      "Weight" -> WeightRecord::class
      "Height" -> HeightRecord::class
      "BloodPressure" -> BloodPressureRecord::class
      "BloodGlucose" -> BloodGlucoseRecord::class
      "OxygenSaturation" -> OxygenSaturationRecord::class
      "BodyTemperature" -> BodyTemperatureRecord::class
      "BodyFat" -> BodyFatRecord::class
      "Hydration" -> HydrationRecord::class
      "ExerciseSession" -> ExerciseSessionRecord::class
      "RestingHeartRate" -> RestingHeartRateRecord::class
      "RespiratoryRate" -> RespiratoryRateRecord::class
      "FloorsClimbed" -> FloorsClimbedRecord::class
      "ElevationGained" -> ElevationGainedRecord::class
      "MindfulnessSession" -> MindfulnessSessionRecord::class
      "SkinTemperature" -> SkinTemperatureRecord::class
      "ActivityIntensity" -> ActivityIntensityRecord::class
      "PlannedExerciseSession" -> PlannedExerciseSessionRecord::class
      else -> throw IllegalArgumentException("Unsupported record type: $recordType")
    }
}
