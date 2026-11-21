package com.androidhealthconnect

import androidx.health.connect.client.records.ExerciseCompletionGoal
import androidx.health.connect.client.records.ExercisePerformanceTarget
import androidx.health.connect.client.records.PlannedExerciseBlock
import androidx.health.connect.client.records.PlannedExerciseSessionRecord
import androidx.health.connect.client.records.PlannedExerciseStep
import androidx.health.connect.client.units.Energy
import androidx.health.connect.client.units.Length
import androidx.health.connect.client.units.Mass
import androidx.health.connect.client.units.Power
import androidx.health.connect.client.units.Velocity
import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.Instant

/**
 * JSON ↔ [PlannedExerciseSessionRecord] (FEATURE_PLANNED_EXERCISE).
 * Completion goals / performance targets use a `{ type: ... }` discriminant.
 */
internal object PlannedExerciseMapper {

    fun toJson(r: PlannedExerciseSessionRecord): JSONObject =
        JSONObject().apply {
            put("recordType", "PlannedExerciseSession")
            put("exerciseType", r.exerciseType)
            put("startTime", r.startTime.toString())
            put("endTime", r.endTime.toString())
            put("title", r.title ?: JSONObject.NULL)
            put("notes", r.notes ?: JSONObject.NULL)
            put("hasExplicitTime", r.hasExplicitTime)
            put(
                "completedExerciseSessionId",
                r.completedExerciseSessionId ?: JSONObject.NULL
            )
            val blocks = JSONArray()
            r.blocks.forEach { blocks.put(blockToJson(it)) }
            put("blocks", blocks)
            r.startZoneOffset?.let { put("startZoneOffset", it.toString()) }
            r.endZoneOffset?.let { put("endZoneOffset", it.toString()) }
            put("metadata", RecordMapper.metadataToJson(r.metadata))
        }

    fun fromJson(j: JSONObject): PlannedExerciseSessionRecord {
        val blocksArr = j.optJSONArray("blocks")
        val blocks =
            if (blocksArr != null) {
                (0 until blocksArr.length()).map { i ->
                    blockFromJson(blocksArr.getJSONObject(i))
                }
            } else {
                emptyList()
            }

        return PlannedExerciseSessionRecord(
            startTime = Instant.parse(j.getString("startTime")),
            startZoneOffset = RecordMapper.parseZoneOffset(j.optString("startZoneOffset")),
            endTime = Instant.parse(j.getString("endTime")),
            endZoneOffset = RecordMapper.parseZoneOffset(j.optString("endZoneOffset")),
            metadata = RecordMapper.jsonToMetadata(j.optJSONObject("metadata")),
            blocks = blocks,
            exerciseType = j.getInt("exerciseType"),
            title = j.optString("title").ifEmpty { null },
            notes = j.optString("notes").ifEmpty { null },
        )
    }

    private fun blockToJson(b: PlannedExerciseBlock): JSONObject =
        JSONObject().apply {
            put("repetitions", b.repetitions)
            put("description", b.description ?: JSONObject.NULL)
            val steps = JSONArray()
            b.steps.forEach { steps.put(stepToJson(it)) }
            put("steps", steps)
        }

    private fun blockFromJson(j: JSONObject): PlannedExerciseBlock {
        val stepsArr = j.getJSONArray("steps")
        val steps =
            (0 until stepsArr.length()).map { i ->
                stepFromJson(stepsArr.getJSONObject(i))
            }
        return PlannedExerciseBlock(
            repetitions = j.getInt("repetitions"),
            steps = steps,
            description = j.optString("description").ifEmpty { null },
        )
    }

    private fun stepToJson(s: PlannedExerciseStep): JSONObject =
        JSONObject().apply {
            put("exerciseType", s.exerciseType)
            put("exercisePhase", s.exercisePhase)
            put("description", s.description ?: JSONObject.NULL)
            put("completionGoal", completionGoalToJson(s.completionGoal))
            val targets = JSONArray()
            s.performanceTargets.forEach { targets.put(performanceTargetToJson(it)) }
            put("performanceTargets", targets)
        }

    private fun stepFromJson(j: JSONObject): PlannedExerciseStep {
        val targetsArr = j.optJSONArray("performanceTargets")
        val targets =
            if (targetsArr != null) {
                (0 until targetsArr.length()).map { i ->
                    performanceTargetFromJson(targetsArr.getJSONObject(i))
                }
            } else {
                emptyList()
            }
        return PlannedExerciseStep(
            exerciseType = j.getInt("exerciseType"),
            exercisePhase =
                j.optInt("exercisePhase", PlannedExerciseStep.EXERCISE_PHASE_ACTIVE),
            completionGoal = completionGoalFromJson(j.getJSONObject("completionGoal")),
            performanceTargets = targets,
            description = j.optString("description").ifEmpty { null },
        )
    }

    private fun completionGoalToJson(goal: ExerciseCompletionGoal): JSONObject =
        when (goal) {
            is ExerciseCompletionGoal.DistanceGoal ->
                JSONObject()
                    .put("type", "Distance")
                    .put("distance", goal.distance.inMeters)
            is ExerciseCompletionGoal.DurationGoal ->
                JSONObject()
                    .put("type", "Duration")
                    .put("durationMillis", goal.duration.toMillis())
            is ExerciseCompletionGoal.RepetitionsGoal ->
                JSONObject()
                    .put("type", "Repetitions")
                    .put("repetitions", goal.repetitions)
            is ExerciseCompletionGoal.StepsGoal ->
                JSONObject().put("type", "Steps").put("steps", goal.steps)
            is ExerciseCompletionGoal.ActiveCaloriesBurnedGoal ->
                JSONObject()
                    .put("type", "ActiveCaloriesBurned")
                    .put("energy", goal.activeCalories.inKilocalories)
            is ExerciseCompletionGoal.TotalCaloriesBurnedGoal ->
                JSONObject()
                    .put("type", "TotalCaloriesBurned")
                    .put("energy", goal.totalCalories.inKilocalories)
            is ExerciseCompletionGoal.DistanceAndDurationGoal ->
                JSONObject()
                    .put("type", "DistanceAndDuration")
                    .put("distance", goal.distance.inMeters)
                    .put("durationMillis", goal.duration.toMillis())
            is ExerciseCompletionGoal.ManualCompletion ->
                JSONObject().put("type", "ManualCompletion")
            else -> JSONObject().put("type", "Unknown")
        }

    private fun completionGoalFromJson(j: JSONObject): ExerciseCompletionGoal =
        when (j.getString("type")) {
            "Distance" ->
                ExerciseCompletionGoal.DistanceGoal(Length.meters(j.getDouble("distance")))
            "Duration" ->
                ExerciseCompletionGoal.DurationGoal(Duration.ofMillis(j.getLong("durationMillis")))
            "Repetitions" ->
                ExerciseCompletionGoal.RepetitionsGoal(j.getInt("repetitions"))
            "Steps" -> ExerciseCompletionGoal.StepsGoal(j.getInt("steps"))
            "ActiveCaloriesBurned" ->
                ExerciseCompletionGoal.ActiveCaloriesBurnedGoal(
                    Energy.kilocalories(j.getDouble("energy"))
                )
            "TotalCaloriesBurned" ->
                ExerciseCompletionGoal.TotalCaloriesBurnedGoal(
                    Energy.kilocalories(j.getDouble("energy"))
                )
            "DistanceAndDuration" ->
                ExerciseCompletionGoal.DistanceAndDurationGoal(
                    Length.meters(j.getDouble("distance")),
                    Duration.ofMillis(j.getLong("durationMillis")),
                )
            "ManualCompletion" -> ExerciseCompletionGoal.ManualCompletion
            else -> ExerciseCompletionGoal.UnknownGoal
        }

    private fun performanceTargetToJson(t: ExercisePerformanceTarget): JSONObject =
        when (t) {
            is ExercisePerformanceTarget.HeartRateTarget ->
                JSONObject()
                    .put("type", "HeartRate")
                    .put("minHeartRate", t.minHeartRate)
                    .put("maxHeartRate", t.maxHeartRate)
            is ExercisePerformanceTarget.SpeedTarget ->
                JSONObject()
                    .put("type", "Speed")
                    .put("minMetersPerSecond", t.minSpeed.inMetersPerSecond)
                    .put("maxMetersPerSecond", t.maxSpeed.inMetersPerSecond)
            is ExercisePerformanceTarget.PowerTarget ->
                JSONObject()
                    .put("type", "Power")
                    .put("minWatts", t.minPower.inWatts)
                    .put("maxWatts", t.maxPower.inWatts)
            is ExercisePerformanceTarget.CadenceTarget ->
                JSONObject()
                    .put("type", "Cadence")
                    .put("minRpm", t.minCadence)
                    .put("maxRpm", t.maxCadence)
            is ExercisePerformanceTarget.WeightTarget ->
                JSONObject().put("type", "Weight").put("mass", t.mass.inKilograms)
            is ExercisePerformanceTarget.RateOfPerceivedExertionTarget ->
                JSONObject().put("type", "RateOfPerceivedExertion").put("rpe", t.rpe)
            is ExercisePerformanceTarget.AmrapTarget ->
                JSONObject().put("type", "Amrap")
            else -> JSONObject().put("type", "Unknown")
        }

    private fun performanceTargetFromJson(j: JSONObject): ExercisePerformanceTarget =
        when (j.getString("type")) {
            "HeartRate" ->
                ExercisePerformanceTarget.HeartRateTarget(
                    j.getDouble("minHeartRate"),
                    j.getDouble("maxHeartRate"),
                )
            "Speed" ->
                ExercisePerformanceTarget.SpeedTarget(
                    Velocity.metersPerSecond(j.getDouble("minMetersPerSecond")),
                    Velocity.metersPerSecond(j.getDouble("maxMetersPerSecond")),
                )
            "Power" ->
                ExercisePerformanceTarget.PowerTarget(
                    Power.watts(j.getDouble("minWatts")),
                    Power.watts(j.getDouble("maxWatts")),
                )
            "Cadence" ->
                ExercisePerformanceTarget.CadenceTarget(
                    j.getDouble("minRpm"),
                    j.getDouble("maxRpm"),
                )
            "Weight" ->
                ExercisePerformanceTarget.WeightTarget(Mass.kilograms(j.getDouble("mass")))
            "RateOfPerceivedExertion" ->
                ExercisePerformanceTarget.RateOfPerceivedExertionTarget(j.getInt("rpe"))
            "Amrap" -> ExercisePerformanceTarget.AmrapTarget
            else -> ExercisePerformanceTarget.UnknownTarget
        }
}
