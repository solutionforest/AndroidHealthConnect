package com.androidhealthconnect

import androidx.health.connect.client.records.*
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class ExtendedRecordMapperTest {

  @Test
  fun jsonToRecord_mapsAllParityTypes() {
    val cases =
      listOf(
        interval("Nutrition").put("energy", 650.0).put("protein", 30.0) to NutritionRecord::class,
        instant("Vo2Max").put("vo2MillilitersPerMinuteKilogram", 48.2) to Vo2MaxRecord::class,
        series("Speed", "metersPerSecond", 3.5) to SpeedRecord::class,
        series("Power", "watts", 220.0) to PowerRecord::class,
        series("StepsCadence", "rate", 160.0) to StepsCadenceRecord::class,
        series("CyclingPedalingCadence", "revolutionsPerMinute", 90.0) to
          CyclingPedalingCadenceRecord::class,
        interval("WheelchairPushes").put("count", 125) to WheelchairPushesRecord::class,
        instant("MenstruationFlow").put("flow", 2) to MenstruationFlowRecord::class,
        interval("MenstruationPeriod") to MenstruationPeriodRecord::class,
        instant("OvulationTest").put("result", 1) to OvulationTestRecord::class,
        instant("CervicalMucus").put("appearance", 5).put("sensation", 2) to
          CervicalMucusRecord::class,
        instant("IntermenstrualBleeding") to IntermenstrualBleedingRecord::class,
        instant("SexualActivity").put("protectionUsed", 1) to SexualActivityRecord::class,
        instant("BasalBodyTemperature").put("temperature", 36.5) to
          BasalBodyTemperatureRecord::class,
        instant("LeanBodyMass").put("mass", 58.2) to LeanBodyMassRecord::class,
        instant("BoneMass").put("mass", 3.1) to BoneMassRecord::class,
        instant("BodyWaterMass").put("mass", 42.4) to BodyWaterMassRecord::class,
        instant("BasalMetabolicRate").put("basalMetabolicRate", 1650.0) to
          BasalMetabolicRateRecord::class,
        instant("HeartRateVariabilityRmssd").put("heartRateVariabilityMillis", 42.0) to
          HeartRateVariabilityRmssdRecord::class,
      )

    assertEquals(19, cases.size)
    cases.forEach { (json, expected) ->
      val record = RecordMapper.jsonToRecord(json)
      assertTrue(
        "Expected ${expected.simpleName}, got ${record::class.simpleName}",
        expected.isInstance(record),
      )
    }
  }

  @Test
  fun nutrition_roundTripsGramAndKilocalorieUnits() {
    val record =
      RecordMapper.jsonToRecord(
        interval("Nutrition")
          .put("energy", 650.0)
          .put("energyFromFat", 180.0)
          .put("protein", 30.0)
          .put("name", "Lunch")
      ) as NutritionRecord

    val json = RecordMapper.recordToJson(record)
    assertEquals(650.0, json.getDouble("energy"), 0.001)
    assertEquals(180.0, json.getDouble("energyFromFat"), 0.001)
    assertEquals(30.0, json.getDouble("protein"), 0.001)
    assertEquals("Lunch", json.getString("name"))
  }

  @Test
  fun representativeParityRecords_roundTrip() {
    val cases =
      listOf(
        instant("Vo2Max")
          .put("vo2MillilitersPerMinuteKilogram", 48.2)
          .put("measurementMethod", 1),
        instant("MenstruationFlow").put("flow", 3),
        instant("HeartRateVariabilityRmssd").put("heartRateVariabilityMillis", 42.0),
        series("Speed", "metersPerSecond", 3.5),
      )

    cases.forEach { input ->
      val output = RecordMapper.recordToJson(RecordMapper.jsonToRecord(input))
      assertEquals(input.getString("recordType"), output.getString("recordType"))
    }

    val speed = RecordMapper.recordToJson(RecordMapper.jsonToRecord(cases.last()))
    assertEquals(
      3.5,
      speed.getJSONArray("samples").getJSONObject(0).getDouble("metersPerSecond"),
      0.001,
    )
  }

  private fun interval(type: String) =
    JSONObject()
      .put("recordType", type)
      .put("startTime", START)
      .put("endTime", END)

  private fun instant(type: String) =
    JSONObject().put("recordType", type).put("time", START)

  private fun series(type: String, valueKey: String, value: Double) =
    interval(type)
      .put(
        "samples",
        JSONArray().put(JSONObject().put("time", START).put(valueKey, value)),
      )

  private companion object {
    const val START = "2024-01-01T08:00:00Z"
    const val END = "2024-01-01T09:00:00Z"
  }
}
