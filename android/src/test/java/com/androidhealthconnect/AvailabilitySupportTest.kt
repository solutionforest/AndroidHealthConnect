package com.androidhealthconnect

import androidx.health.connect.client.HealthConnectClient
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class AvailabilitySupportTest {

    @Test
    fun mapStatus_matchesOfficialSdkConstants() {
        assertEquals(
            "available",
            AvailabilitySupport.mapStatus(HealthConnectClient.SDK_AVAILABLE)
        )
        assertEquals(
            "notInstalled",
            AvailabilitySupport.mapStatus(
                HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
            )
        )
        assertEquals(
            "notSupported",
            AvailabilitySupport.mapStatus(HealthConnectClient.SDK_UNAVAILABLE)
        )
        // Common misread: raw 3 is SDK_AVAILABLE, not "version too old".
        assertEquals(3, HealthConnectClient.SDK_AVAILABLE)
        assertEquals("available", AvailabilitySupport.mapStatus(3))
    }

    @Test
    fun providerKind_frameworkOnAndroid14Plus() {
        assertEquals("framework", AvailabilitySupport.providerKind(34))
        assertEquals("framework", AvailabilitySupport.providerKind(35))
        assertEquals("apk", AvailabilitySupport.providerKind(33))
        assertEquals("apk", AvailabilitySupport.providerKind(28))
        assertEquals("none", AvailabilitySupport.providerKind(27))
    }

    @Test
    fun buildAdvice_flagsChinaStyleNoGms() {
        val advice =
            AvailabilitySupport.buildAdvice(
                sdkStatus = HealthConnectClient.SDK_UNAVAILABLE,
                provider = "apk",
                googlePlayServicesAvailable = false,
                playStoreAvailable = false,
            )
        assertTrue(advice.contains("Google Play services"))
        assertTrue(advice.contains("China") || advice.contains("HMS"))
    }

    @Test
    fun buildAdvice_notInstalledWithoutPlayStore() {
        val advice =
            AvailabilitySupport.buildAdvice(
                sdkStatus = HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED,
                provider = "apk",
                googlePlayServicesAvailable = true,
                playStoreAvailable = false,
            )
        assertTrue(advice.contains("Play Store"))
    }

    @Test
    fun toJson_includesRawSdkFields() {
        val json =
            AvailabilitySupport.toJson(
                sdkStatus = HealthConnectClient.SDK_AVAILABLE,
                provider = "framework",
                googlePlayServicesAvailable = true,
                playStoreAvailable = true,
                androidSdkInt = 34,
            )
        assertEquals("available", json.getString("status"))
        assertEquals(3, json.getInt("sdkStatus"))
        assertEquals("SDK_AVAILABLE", json.getString("sdkStatusName"))
        assertEquals("framework", json.getString("provider"))
        assertTrue(json.getBoolean("googlePlayServicesAvailable"))
    }
}
