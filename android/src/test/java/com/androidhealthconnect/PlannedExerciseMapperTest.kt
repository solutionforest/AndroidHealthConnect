package com.androidhealthconnect

import androidx.health.connect.client.records.ExerciseCompletionGoal
import androidx.health.connect.client.records.ExercisePerformanceTarget
import androidx.health.connect.client.records.ExerciseSegment
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.PlannedExerciseSessionRecord
import androidx.health.connect.client.records.PlannedExerciseStep
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
class PlannedExerciseMapperTest {

    @Test
    fun jsonRoundTrip_mapsBlocksGoalsAndHeartRateTarget() {
        val json =
            JSONObject()
                .put("recordType", "PlannedExerciseSession")
                .put("exerciseType", ExerciseSessionRecord.EXERCISE_TYPE_RUNNING)
                .put("startTime", "2024-01-03T08:00:00Z")
                .put("endTime", "2024-01-03T09:30:00Z")
                .put("title", "Lake run")
                .put(
                    "blocks",
                    JSONArray().put(
                        JSONObject()
                            .put("repetitions", 1)
                            .put("description", "Three laps")
                            .put(
                                "steps",
                                JSONArray().put(
                                    JSONObject()
                                        .put(
                                            "exerciseType",
                                            ExerciseSegment.EXERCISE_SEGMENT_TYPE_RUNNING
                                        )
                                        .put(
                                            "exercisePhase",
                                            PlannedExerciseStep.EXERCISE_PHASE_ACTIVE
                                        )
                                        .put(
                                            "completionGoal",
                                            JSONObject()
                                                .put("type", "Repetitions")
                                                .put("repetitions", 3)
                                        )
                                        .put(
                                            "performanceTargets",
                                            JSONArray().put(
                                                JSONObject()
                                                    .put("type", "HeartRate")
                                                    .put("minHeartRate", 90.0)
                                                    .put("maxHeartRate", 110.0)
                                            )
                                        )
                                )
                            )
                    )
                )

        val record = RecordMapper.jsonToRecord(json) as PlannedExerciseSessionRecord
        assertEquals(ExerciseSessionRecord.EXERCISE_TYPE_RUNNING, record.exerciseType)
        assertEquals(1, record.blocks.size)
        assertEquals(1, record.blocks[0].steps.size)

        val step = record.blocks[0].steps[0]
        assertEquals(PlannedExerciseStep.EXERCISE_PHASE_ACTIVE, step.exercisePhase)
        assertTrue(step.completionGoal is ExerciseCompletionGoal.RepetitionsGoal)
        assertEquals(
            3,
            (step.completionGoal as ExerciseCompletionGoal.RepetitionsGoal).repetitions
        )
        assertEquals(1, step.performanceTargets.size)
        val hr = step.performanceTargets[0] as ExercisePerformanceTarget.HeartRateTarget
        assertEquals(90.0, hr.minHeartRate, 0.0)
        assertEquals(110.0, hr.maxHeartRate, 0.0)

        val out = PlannedExerciseMapper.toJson(record)
        assertEquals("PlannedExerciseSession", out.getString("recordType"))
        assertEquals(
            3,
            out.getJSONArray("blocks")
                .getJSONObject(0)
                .getJSONArray("steps")
                .getJSONObject(0)
                .getJSONObject("completionGoal")
                .getInt("repetitions")
        )
    }
}
