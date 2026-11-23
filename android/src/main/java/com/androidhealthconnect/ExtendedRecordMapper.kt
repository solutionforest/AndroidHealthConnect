package com.androidhealthconnect

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.*
import androidx.health.connect.client.records.metadata.DataOrigin
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Mass
import androidx.health.connect.client.units.Power as PowerUnit
import androidx.health.connect.client.units.Temperature
import androidx.health.connect.client.units.Velocity
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import kotlin.reflect.KClass

/** JSON bridge for the Health Connect record types added in the parity batch. */
internal object ExtendedRecordMapper {
  val recordTypes: Set<String> =
    setOf(
      "Nutrition",
      "Vo2Max",
      "Speed",
      "Power",
      "StepsCadence",
      "CyclingPedalingCadence",
      "WheelchairPushes",
      "MenstruationFlow",
      "MenstruationPeriod",
      "OvulationTest",
      "CervicalMucus",
      "IntermenstrualBleeding",
      "SexualActivity",
      "BasalBodyTemperature",
      "LeanBodyMass",
      "BoneMass",
      "BodyWaterMass",
      "BasalMetabolicRate",
      "HeartRateVariabilityRmssd",
    )

  suspend fun readRecords(
    client: HealthConnectClient,
    recordType: String,
    options: JSONObject,
  ): JSONObject {
    val filter = parseTimeRangeFilter(options)
    val origins = parseDataOriginFilter(options)
    val ascending = options.optBoolean("ascendingOrder", true)
    val pageSize = options.optInt("pageSize", 1000)
    val pageToken = options.optString("pageToken").ifEmpty { null }

    return when (recordType) {
      "Nutrition" -> read(client, NutritionRecord::class, filter, origins, ascending, pageSize, pageToken)
      "Vo2Max" -> read(client, Vo2MaxRecord::class, filter, origins, ascending, pageSize, pageToken)
      "Speed" -> read(client, SpeedRecord::class, filter, origins, ascending, pageSize, pageToken)
      "Power" -> read(client, PowerRecord::class, filter, origins, ascending, pageSize, pageToken)
      "StepsCadence" -> read(client, StepsCadenceRecord::class, filter, origins, ascending, pageSize, pageToken)
      "CyclingPedalingCadence" -> read(client, CyclingPedalingCadenceRecord::class, filter, origins, ascending, pageSize, pageToken)
      "WheelchairPushes" -> read(client, WheelchairPushesRecord::class, filter, origins, ascending, pageSize, pageToken)
      "MenstruationFlow" -> read(client, MenstruationFlowRecord::class, filter, origins, ascending, pageSize, pageToken)
      "MenstruationPeriod" -> read(client, MenstruationPeriodRecord::class, filter, origins, ascending, pageSize, pageToken)
      "OvulationTest" -> read(client, OvulationTestRecord::class, filter, origins, ascending, pageSize, pageToken)
      "CervicalMucus" -> read(client, CervicalMucusRecord::class, filter, origins, ascending, pageSize, pageToken)
      "IntermenstrualBleeding" -> read(client, IntermenstrualBleedingRecord::class, filter, origins, ascending, pageSize, pageToken)
      "SexualActivity" -> read(client, SexualActivityRecord::class, filter, origins, ascending, pageSize, pageToken)
      "BasalBodyTemperature" -> read(client, BasalBodyTemperatureRecord::class, filter, origins, ascending, pageSize, pageToken)
      "LeanBodyMass" -> read(client, LeanBodyMassRecord::class, filter, origins, ascending, pageSize, pageToken)
      "BoneMass" -> read(client, BoneMassRecord::class, filter, origins, ascending, pageSize, pageToken)
      "BodyWaterMass" -> read(client, BodyWaterMassRecord::class, filter, origins, ascending, pageSize, pageToken)
      "BasalMetabolicRate" -> read(client, BasalMetabolicRateRecord::class, filter, origins, ascending, pageSize, pageToken)
      "HeartRateVariabilityRmssd" -> read(client, HeartRateVariabilityRmssdRecord::class, filter, origins, ascending, pageSize, pageToken)
      else -> throw IllegalArgumentException("Unsupported extended record type: $recordType")
    }
  }

  private suspend fun <T : Record> read(
    client: HealthConnectClient,
    clazz: KClass<T>,
    filter: TimeRangeFilter,
    origins: Set<DataOrigin>,
    ascending: Boolean,
    pageSize: Int,
    pageToken: String?,
  ): JSONObject {
    val result =
      client.readRecords(
        ReadRecordsRequest(clazz, filter, origins, ascending, pageSize, pageToken)
      )
    return JSONObject()
      .put("records", JSONArray(result.records.map(::toJson)))
      .put("pageToken", result.pageToken ?: JSONObject.NULL)
  }

  fun toJson(record: Record): JSONObject =
    when (record) {
      is NutritionRecord -> nutritionToJson(record)
      is Vo2MaxRecord -> instantJson("Vo2Max", record.time, record.zoneOffset, record.metadata).apply {
        put("vo2MillilitersPerMinuteKilogram", record.vo2MillilitersPerMinuteKilogram)
        put("measurementMethod", record.measurementMethod)
      }
      is SpeedRecord -> seriesJson(
        "Speed",
        record.startTime,
        record.startZoneOffset,
        record.endTime,
        record.endZoneOffset,
        record.samples,
        record.metadata,
      ) { sample ->
        JSONObject()
          .put("time", sample.time.toString())
          .put("metersPerSecond", sample.speed.inMetersPerSecond)
      }
      is PowerRecord -> seriesJson(
        "Power",
        record.startTime,
        record.startZoneOffset,
        record.endTime,
        record.endZoneOffset,
        record.samples,
        record.metadata,
      ) { sample ->
        JSONObject().put("time", sample.time.toString()).put("watts", sample.power.inWatts)
      }
      is StepsCadenceRecord -> seriesJson(
        "StepsCadence",
        record.startTime,
        record.startZoneOffset,
        record.endTime,
        record.endZoneOffset,
        record.samples,
        record.metadata,
      ) { sample ->
        JSONObject().put("time", sample.time.toString()).put("rate", sample.rate)
      }
      is CyclingPedalingCadenceRecord ->
        seriesJson(
          "CyclingPedalingCadence",
          record.startTime,
          record.startZoneOffset,
          record.endTime,
          record.endZoneOffset,
          record.samples,
          record.metadata,
        ) { sample ->
          JSONObject()
            .put("time", sample.time.toString())
            .put("revolutionsPerMinute", sample.revolutionsPerMinute)
        }
      is WheelchairPushesRecord ->
        intervalJson(
          "WheelchairPushes",
          record.startTime,
          record.startZoneOffset,
          record.endTime,
          record.endZoneOffset,
          record.metadata,
        ).put("count", record.count)
      is MenstruationFlowRecord ->
        instantJson("MenstruationFlow", record.time, record.zoneOffset, record.metadata)
          .put("flow", record.flow)
      is MenstruationPeriodRecord ->
        intervalJson(
          "MenstruationPeriod",
          record.startTime,
          record.startZoneOffset,
          record.endTime,
          record.endZoneOffset,
          record.metadata,
        )
      is OvulationTestRecord ->
        instantJson("OvulationTest", record.time, record.zoneOffset, record.metadata)
          .put("result", record.result)
      is CervicalMucusRecord -> instantJson(
        "CervicalMucus",
        record.time,
        record.zoneOffset,
        record.metadata,
      )
        .put("appearance", record.appearance)
        .put("sensation", record.sensation)
      is IntermenstrualBleedingRecord ->
        instantJson("IntermenstrualBleeding", record.time, record.zoneOffset, record.metadata)
      is SexualActivityRecord ->
        instantJson("SexualActivity", record.time, record.zoneOffset, record.metadata)
          .put("protectionUsed", record.protectionUsed)
      is BasalBodyTemperatureRecord ->
        instantJson("BasalBodyTemperature", record.time, record.zoneOffset, record.metadata)
        .put("temperature", record.temperature.inCelsius)
        .put("measurementLocation", record.measurementLocation)
      is LeanBodyMassRecord ->
        instantJson("LeanBodyMass", record.time, record.zoneOffset, record.metadata)
          .put("mass", record.mass.inKilograms)
      is BoneMassRecord ->
        instantJson("BoneMass", record.time, record.zoneOffset, record.metadata)
          .put("mass", record.mass.inKilograms)
      is BodyWaterMassRecord ->
        instantJson("BodyWaterMass", record.time, record.zoneOffset, record.metadata)
          .put("mass", record.mass.inKilograms)
      is BasalMetabolicRateRecord ->
        instantJson("BasalMetabolicRate", record.time, record.zoneOffset, record.metadata)
          .put("basalMetabolicRate", record.basalMetabolicRate.inKilocaloriesPerDay)
      is HeartRateVariabilityRmssdRecord ->
        instantJson(
          "HeartRateVariabilityRmssd",
          record.time,
          record.zoneOffset,
          record.metadata,
        )
          .put("heartRateVariabilityMillis", record.heartRateVariabilityMillis)
      else ->
        throw IllegalArgumentException(
          "Unsupported extended record class: ${record::class.java.simpleName}"
        )
    }

  fun fromJson(json: JSONObject): Record =
    when (val type = json.getString("recordType")) {
      "Nutrition" -> jsonToNutrition(json)
      "Vo2Max" ->
        Vo2MaxRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          metadata = metadata(json),
          vo2MillilitersPerMinuteKilogram =
            json.getDouble("vo2MillilitersPerMinuteKilogram"),
          measurementMethod =
            json.optInt("measurementMethod", Vo2MaxRecord.MEASUREMENT_METHOD_OTHER),
        )
      "Speed" ->
        SpeedRecord(
          startTime = start(json),
          startZoneOffset = startZoneOffset(json),
          endTime = end(json),
          endZoneOffset = endZoneOffset(json),
          samples =
            json.objects("samples").map {
              SpeedRecord.Sample(
                time = Instant.parse(it.getString("time")),
                speed = Velocity.metersPerSecond(it.getDouble("metersPerSecond")),
              )
            },
          metadata = metadata(json),
        )
      "Power" ->
        PowerRecord(
          startTime = start(json),
          startZoneOffset = startZoneOffset(json),
          endTime = end(json),
          endZoneOffset = endZoneOffset(json),
          samples =
            json.objects("samples").map {
              PowerRecord.Sample(
                time = Instant.parse(it.getString("time")),
                power = PowerUnit.watts(it.getDouble("watts")),
              )
            },
          metadata = metadata(json),
        )
      "StepsCadence" ->
        StepsCadenceRecord(
          startTime = start(json),
          startZoneOffset = startZoneOffset(json),
          endTime = end(json),
          endZoneOffset = endZoneOffset(json),
          samples =
            json.objects("samples").map {
              StepsCadenceRecord.Sample(
                time = Instant.parse(it.getString("time")),
                rate = it.getDouble("rate"),
              )
            },
          metadata = metadata(json),
        )
      "CyclingPedalingCadence" ->
        CyclingPedalingCadenceRecord(
          startTime = start(json),
          startZoneOffset = startZoneOffset(json),
          endTime = end(json),
          endZoneOffset = endZoneOffset(json),
          samples =
            json.objects("samples").map {
              CyclingPedalingCadenceRecord.Sample(
                time = Instant.parse(it.getString("time")),
                revolutionsPerMinute = it.getDouble("revolutionsPerMinute"),
              )
            },
          metadata = metadata(json),
        )
      "WheelchairPushes" ->
        WheelchairPushesRecord(
          startTime = start(json),
          startZoneOffset = startZoneOffset(json),
          endTime = end(json),
          endZoneOffset = endZoneOffset(json),
          count = json.getLong("count"),
          metadata = metadata(json),
        )
      "MenstruationFlow" ->
        MenstruationFlowRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          metadata = metadata(json),
          flow = json.optInt("flow", MenstruationFlowRecord.FLOW_UNKNOWN),
        )
      "MenstruationPeriod" ->
        MenstruationPeriodRecord(
          startTime = start(json),
          startZoneOffset = startZoneOffset(json),
          endTime = end(json),
          endZoneOffset = endZoneOffset(json),
          metadata = metadata(json),
        )
      "OvulationTest" ->
        OvulationTestRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          result = json.getInt("result"),
          metadata = metadata(json),
        )
      "CervicalMucus" ->
        CervicalMucusRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          metadata = metadata(json),
          appearance =
            json.optInt("appearance", CervicalMucusRecord.APPEARANCE_UNKNOWN),
          sensation = json.optInt("sensation", CervicalMucusRecord.SENSATION_UNKNOWN),
        )
      "IntermenstrualBleeding" ->
        IntermenstrualBleedingRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          metadata = metadata(json),
        )
      "SexualActivity" ->
        SexualActivityRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          metadata = metadata(json),
          protectionUsed =
            json.optInt(
              "protectionUsed",
              SexualActivityRecord.PROTECTION_USED_UNKNOWN,
            ),
        )
      "BasalBodyTemperature" ->
        BasalBodyTemperatureRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          metadata = metadata(json),
          temperature = Temperature.celsius(json.getDouble("temperature")),
          measurementLocation = json.optInt("measurementLocation", 0),
        )
      "LeanBodyMass" -> massRecord(json) { time, offset, mass, meta ->
        LeanBodyMassRecord(time, offset, mass, meta)
      }
      "BoneMass" -> massRecord(json) { time, offset, mass, meta ->
        BoneMassRecord(time, offset, mass, meta)
      }
      "BodyWaterMass" -> massRecord(json) { time, offset, mass, meta ->
        BodyWaterMassRecord(time, offset, mass, meta)
      }
      "BasalMetabolicRate" ->
        BasalMetabolicRateRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          basalMetabolicRate =
            PowerUnit.kilocaloriesPerDay(json.getDouble("basalMetabolicRate")),
          metadata = metadata(json),
        )
      "HeartRateVariabilityRmssd" ->
        HeartRateVariabilityRmssdRecord(
          time = instant(json),
          zoneOffset = zoneOffset(json),
          heartRateVariabilityMillis = json.getDouble("heartRateVariabilityMillis"),
          metadata = metadata(json),
        )
      else -> throw IllegalArgumentException("Unsupported extended record type: $type")
    }

  suspend fun deleteByTimeRange(
    client: HealthConnectClient,
    recordType: String,
    filter: TimeRangeFilter,
  ) {
    when (recordType) {
      "Nutrition" -> client.deleteRecords(NutritionRecord::class, filter)
      "Vo2Max" -> client.deleteRecords(Vo2MaxRecord::class, filter)
      "Speed" -> client.deleteRecords(SpeedRecord::class, filter)
      "Power" -> client.deleteRecords(PowerRecord::class, filter)
      "StepsCadence" -> client.deleteRecords(StepsCadenceRecord::class, filter)
      "CyclingPedalingCadence" -> client.deleteRecords(CyclingPedalingCadenceRecord::class, filter)
      "WheelchairPushes" -> client.deleteRecords(WheelchairPushesRecord::class, filter)
      "MenstruationFlow" -> client.deleteRecords(MenstruationFlowRecord::class, filter)
      "MenstruationPeriod" -> client.deleteRecords(MenstruationPeriodRecord::class, filter)
      "OvulationTest" -> client.deleteRecords(OvulationTestRecord::class, filter)
      "CervicalMucus" -> client.deleteRecords(CervicalMucusRecord::class, filter)
      "IntermenstrualBleeding" -> client.deleteRecords(IntermenstrualBleedingRecord::class, filter)
      "SexualActivity" -> client.deleteRecords(SexualActivityRecord::class, filter)
      "BasalBodyTemperature" -> client.deleteRecords(BasalBodyTemperatureRecord::class, filter)
      "LeanBodyMass" -> client.deleteRecords(LeanBodyMassRecord::class, filter)
      "BoneMass" -> client.deleteRecords(BoneMassRecord::class, filter)
      "BodyWaterMass" -> client.deleteRecords(BodyWaterMassRecord::class, filter)
      "BasalMetabolicRate" -> client.deleteRecords(BasalMetabolicRateRecord::class, filter)
      "HeartRateVariabilityRmssd" ->
        client.deleteRecords(HeartRateVariabilityRmssdRecord::class, filter)
      else -> throw IllegalArgumentException("Unsupported extended record type: $recordType")
    }
  }

  suspend fun deleteByIds(
    client: HealthConnectClient,
    recordType: String,
    ids: List<String>,
  ) {
    when (recordType) {
      "Nutrition" -> client.deleteRecords(NutritionRecord::class, ids, emptyList())
      "Vo2Max" -> client.deleteRecords(Vo2MaxRecord::class, ids, emptyList())
      "Speed" -> client.deleteRecords(SpeedRecord::class, ids, emptyList())
      "Power" -> client.deleteRecords(PowerRecord::class, ids, emptyList())
      "StepsCadence" -> client.deleteRecords(StepsCadenceRecord::class, ids, emptyList())
      "CyclingPedalingCadence" ->
        client.deleteRecords(CyclingPedalingCadenceRecord::class, ids, emptyList())
      "WheelchairPushes" -> client.deleteRecords(WheelchairPushesRecord::class, ids, emptyList())
      "MenstruationFlow" -> client.deleteRecords(MenstruationFlowRecord::class, ids, emptyList())
      "MenstruationPeriod" -> client.deleteRecords(MenstruationPeriodRecord::class, ids, emptyList())
      "OvulationTest" -> client.deleteRecords(OvulationTestRecord::class, ids, emptyList())
      "CervicalMucus" -> client.deleteRecords(CervicalMucusRecord::class, ids, emptyList())
      "IntermenstrualBleeding" ->
        client.deleteRecords(IntermenstrualBleedingRecord::class, ids, emptyList())
      "SexualActivity" -> client.deleteRecords(SexualActivityRecord::class, ids, emptyList())
      "BasalBodyTemperature" ->
        client.deleteRecords(BasalBodyTemperatureRecord::class, ids, emptyList())
      "LeanBodyMass" -> client.deleteRecords(LeanBodyMassRecord::class, ids, emptyList())
      "BoneMass" -> client.deleteRecords(BoneMassRecord::class, ids, emptyList())
      "BodyWaterMass" -> client.deleteRecords(BodyWaterMassRecord::class, ids, emptyList())
      "BasalMetabolicRate" -> client.deleteRecords(BasalMetabolicRateRecord::class, ids, emptyList())
      "HeartRateVariabilityRmssd" ->
        client.deleteRecords(HeartRateVariabilityRmssdRecord::class, ids, emptyList())
      else -> throw IllegalArgumentException("Unsupported extended record type: $recordType")
    }
  }

  private fun nutritionToJson(record: NutritionRecord): JSONObject =
    intervalJson(
      "Nutrition",
      record.startTime,
      record.startZoneOffset,
      record.endTime,
      record.endZoneOffset,
      record.metadata,
    ).apply {
      putMass("biotin", record.biotin)
      putMass("caffeine", record.caffeine)
      putMass("calcium", record.calcium)
      putEnergy("energy", record.energy)
      putEnergy("energyFromFat", record.energyFromFat)
      putMass("chloride", record.chloride)
      putMass("cholesterol", record.cholesterol)
      putMass("chromium", record.chromium)
      putMass("copper", record.copper)
      putMass("dietaryFiber", record.dietaryFiber)
      putMass("folate", record.folate)
      putMass("folicAcid", record.folicAcid)
      putMass("iodine", record.iodine)
      putMass("iron", record.iron)
      putMass("magnesium", record.magnesium)
      putMass("manganese", record.manganese)
      putMass("molybdenum", record.molybdenum)
      putMass("monounsaturatedFat", record.monounsaturatedFat)
      putMass("niacin", record.niacin)
      putMass("pantothenicAcid", record.pantothenicAcid)
      putMass("phosphorus", record.phosphorus)
      putMass("polyunsaturatedFat", record.polyunsaturatedFat)
      putMass("potassium", record.potassium)
      putMass("protein", record.protein)
      putMass("riboflavin", record.riboflavin)
      putMass("saturatedFat", record.saturatedFat)
      putMass("selenium", record.selenium)
      putMass("sodium", record.sodium)
      putMass("sugar", record.sugar)
      putMass("thiamin", record.thiamin)
      putMass("totalCarbohydrate", record.totalCarbohydrate)
      putMass("totalFat", record.totalFat)
      putMass("transFat", record.transFat)
      putMass("unsaturatedFat", record.unsaturatedFat)
      putMass("vitaminA", record.vitaminA)
      putMass("vitaminB12", record.vitaminB12)
      putMass("vitaminB6", record.vitaminB6)
      putMass("vitaminC", record.vitaminC)
      putMass("vitaminD", record.vitaminD)
      putMass("vitaminE", record.vitaminE)
      putMass("vitaminK", record.vitaminK)
      putMass("zinc", record.zinc)
      put("name", record.name ?: JSONObject.NULL)
      put("mealType", record.mealType)
    }

  private fun jsonToNutrition(json: JSONObject) =
    NutritionRecord(
      startTime = start(json),
      startZoneOffset = startZoneOffset(json),
      endTime = end(json),
      endZoneOffset = endZoneOffset(json),
      metadata = metadata(json),
      biotin = json.mass("biotin"),
      caffeine = json.mass("caffeine"),
      calcium = json.mass("calcium"),
      energy = json.energy("energy"),
      energyFromFat = json.energy("energyFromFat"),
      chloride = json.mass("chloride"),
      cholesterol = json.mass("cholesterol"),
      chromium = json.mass("chromium"),
      copper = json.mass("copper"),
      dietaryFiber = json.mass("dietaryFiber"),
      folate = json.mass("folate"),
      folicAcid = json.mass("folicAcid"),
      iodine = json.mass("iodine"),
      iron = json.mass("iron"),
      magnesium = json.mass("magnesium"),
      manganese = json.mass("manganese"),
      molybdenum = json.mass("molybdenum"),
      monounsaturatedFat = json.mass("monounsaturatedFat"),
      niacin = json.mass("niacin"),
      pantothenicAcid = json.mass("pantothenicAcid"),
      phosphorus = json.mass("phosphorus"),
      polyunsaturatedFat = json.mass("polyunsaturatedFat"),
      potassium = json.mass("potassium"),
      protein = json.mass("protein"),
      riboflavin = json.mass("riboflavin"),
      saturatedFat = json.mass("saturatedFat"),
      selenium = json.mass("selenium"),
      sodium = json.mass("sodium"),
      sugar = json.mass("sugar"),
      thiamin = json.mass("thiamin"),
      totalCarbohydrate = json.mass("totalCarbohydrate"),
      totalFat = json.mass("totalFat"),
      transFat = json.mass("transFat"),
      unsaturatedFat = json.mass("unsaturatedFat"),
      vitaminA = json.mass("vitaminA"),
      vitaminB12 = json.mass("vitaminB12"),
      vitaminB6 = json.mass("vitaminB6"),
      vitaminC = json.mass("vitaminC"),
      vitaminD = json.mass("vitaminD"),
      vitaminE = json.mass("vitaminE"),
      vitaminK = json.mass("vitaminK"),
      zinc = json.mass("zinc"),
      name = json.nullableString("name"),
      mealType = json.optInt("mealType", MealType.MEAL_TYPE_UNKNOWN),
    )

  private fun instantJson(
    type: String,
    time: Instant,
    zoneOffset: java.time.ZoneOffset?,
    metadata: androidx.health.connect.client.records.metadata.Metadata,
  ): JSONObject =
    JSONObject().apply {
      put("recordType", type)
      put("time", time.toString())
      zoneOffset?.let { put("zoneOffset", it.toString()) }
      put("metadata", RecordMapper.metadataToJson(metadata))
    }

  private fun intervalJson(
    type: String,
    startTime: Instant,
    startZoneOffset: java.time.ZoneOffset?,
    endTime: Instant,
    endZoneOffset: java.time.ZoneOffset?,
    metadata: androidx.health.connect.client.records.metadata.Metadata,
  ): JSONObject =
    JSONObject().apply {
      put("recordType", type)
      put("startTime", startTime.toString())
      put("endTime", endTime.toString())
      startZoneOffset?.let { put("startZoneOffset", it.toString()) }
      endZoneOffset?.let { put("endZoneOffset", it.toString()) }
      put("metadata", RecordMapper.metadataToJson(metadata))
    }

  private fun <T : Any> seriesJson(
    type: String,
    startTime: Instant,
    startZoneOffset: java.time.ZoneOffset?,
    endTime: Instant,
    endZoneOffset: java.time.ZoneOffset?,
    samples: List<T>,
    metadata: androidx.health.connect.client.records.metadata.Metadata,
    sampleToJson: (T) -> JSONObject,
  ): JSONObject =
    intervalJson(type, startTime, startZoneOffset, endTime, endZoneOffset, metadata)
      .put("samples", JSONArray(samples.map(sampleToJson)))

  private fun JSONObject.putMass(key: String, value: Mass?) {
    put(key, value?.inGrams ?: JSONObject.NULL)
  }

  private fun JSONObject.putEnergy(key: String, value: Energy?) {
    put(key, value?.inKilocalories ?: JSONObject.NULL)
  }

  private fun JSONObject.mass(key: String): Mass? =
    if (!has(key) || isNull(key)) null else Mass.grams(getDouble(key))

  private fun JSONObject.energy(key: String): Energy? =
    if (!has(key) || isNull(key)) null else Energy.kilocalories(getDouble(key))

  private fun JSONObject.nullableString(key: String): String? =
    if (!has(key) || isNull(key)) null else getString(key)

  private fun JSONObject.objects(key: String): List<JSONObject> {
    val array = getJSONArray(key)
    return (0 until array.length()).map(array::getJSONObject)
  }

  private fun massRecord(
    json: JSONObject,
    factory:
      (
        Instant,
        java.time.ZoneOffset?,
        Mass,
        androidx.health.connect.client.records.metadata.Metadata,
      ) -> Record,
  ): Record =
    factory(
      instant(json),
      zoneOffset(json),
      Mass.kilograms(json.getDouble("mass")),
      metadata(json),
    )

  private fun instant(json: JSONObject) = Instant.parse(json.getString("time"))
  private fun start(json: JSONObject) = Instant.parse(json.getString("startTime"))
  private fun end(json: JSONObject) = Instant.parse(json.getString("endTime"))
  private fun zoneOffset(json: JSONObject) =
    RecordMapper.parseZoneOffset(json.optString("zoneOffset"))
  private fun startZoneOffset(json: JSONObject) =
    RecordMapper.parseZoneOffset(json.optString("startZoneOffset"))
  private fun endZoneOffset(json: JSONObject) =
    RecordMapper.parseZoneOffset(json.optString("endZoneOffset"))
  private fun metadata(json: JSONObject) =
    RecordMapper.jsonToMetadata(json.optJSONObject("metadata"))

  private fun parseTimeRangeFilter(options: JSONObject): TimeRangeFilter {
    val filter = options.optJSONObject("timeRangeFilter")
    if (filter != null) {
      return TimeRangeFilter.between(
        Instant.parse(filter.getString("startTime")),
        Instant.parse(filter.getString("endTime")),
      )
    }
    val now = Instant.now()
    return TimeRangeFilter.between(now.minusSeconds(30L * 24 * 3600), now)
  }

  private fun parseDataOriginFilter(options: JSONObject): Set<DataOrigin> {
    val array = options.optJSONArray("dataOriginFilter") ?: return emptySet()
    return (0 until array.length()).map { DataOrigin(array.getString(it)) }.toSet()
  }
}
