package com.androidhealthconnect

import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.records.StepsRecord
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class FeatureSupportTest {

    @Test
    fun featureFromName_mapsKnownFeatures() {
        assertEquals(
            HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_HISTORY,
            FeatureSupport.featureFromName("readHealthDataHistory")
        )
        assertEquals(
            HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND,
            FeatureSupport.featureFromName("readHealthDataInBackground")
        )
        assertEquals(
            HealthConnectFeatures.FEATURE_EXERCISE_SESSION_IMPROVEMENTS,
            FeatureSupport.featureFromName("exerciseSessionImprovements")
        )
        assertEquals(
            HealthConnectFeatures.FEATURE_PLANNED_EXERCISE,
            FeatureSupport.featureFromName("plannedExercise")
        )
    }

    @Test
    fun featureFromName_rejectsUnknown() {
        try {
            FeatureSupport.featureFromName("notARealFeature")
            throw AssertionError("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            val message = requireNotNull(e.message)
            assertTrue(message.contains("Unknown Health Connect feature"))
        }
    }

    @Test
    fun statusToString_availableVsUnavailable() {
        assertEquals(
            "available",
            FeatureSupport.statusToString(HealthConnectFeatures.FEATURE_STATUS_AVAILABLE)
        )
        assertEquals("unavailable", FeatureSupport.statusToString(0))
    }

    @Test
    fun recordClassForType_steps() {
        assertEquals(StepsRecord::class, FeatureSupport.recordClassForType("Steps"))
    }
}
