package com.androidhealthconnect

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import org.json.JSONObject

/**
 * Maps [HealthConnectClient.getSdkStatus] + device facts into JS-friendly availability.
 *
 * Official statuses (connect-client 1.1+):
 * - [HealthConnectClient.SDK_UNAVAILABLE] = 1 — OS too old / no viable HC; hide integration
 * - [HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED] = 2 — install/update HC APK
 * - [HealthConnectClient.SDK_AVAILABLE] = 3 — safe to call getOrCreate
 *
 * Note: some apps mislabel `3` as "VERSION_TOO_OLD"; it is [SDK_AVAILABLE].
 *
 * China / HMS: Health Connect requires Google Play services and is not offered on the
 * mainland China Play Storefront. Devices without GMS typically stay at UNAVAILABLE.
 */
internal object AvailabilitySupport {
  const val HC_PACKAGE = "com.google.android.apps.healthdata"
  const val PLAY_STORE_PACKAGE = "com.android.vending"
  const val GMS_PACKAGE = "com.google.android.gms"
  const val HC_PLAY_HTTPS =
    "https://play.google.com/store/apps/details?id=$HC_PACKAGE"
  const val HC_PLAY_MARKET =
    "market://details?id=$HC_PACKAGE&url=healthconnect%3A%2F%2Fonboarding"

  fun mapStatus(sdkStatus: Int): String =
    when (sdkStatus) {
      HealthConnectClient.SDK_AVAILABLE -> "available"
      HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "notInstalled"
      else -> "notSupported"
    }

  fun providerKind(sdkInt: Int = Build.VERSION.SDK_INT): String =
    when {
      sdkInt >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE -> "framework" // Android 14+
      sdkInt >= Build.VERSION_CODES.P -> "apk" // Android 9–13 Play APK
      else -> "none"
    }

  fun isPackageInstalled(context: Context, packageName: String): Boolean =
    try {
      context.packageManager.getPackageInfo(packageName, 0)
      true
    } catch (_: PackageManager.NameNotFoundException) {
      false
    }

  fun buildAdvice(
    sdkStatus: Int,
    provider: String,
    googlePlayServicesAvailable: Boolean,
    playStoreAvailable: Boolean,
  ): String {
    val status = mapStatus(sdkStatus)
    return when (status) {
      "available" ->
        when (provider) {
          "framework" ->
            "Health Connect is built into Android 14+ and is ready."
          else ->
            "Health Connect APK is installed and ready."
        }
      "notInstalled" ->
        when {
          !googlePlayServicesAvailable ->
            "Health Connect needs Google Play services. " +
              "This device looks like it has no GMS (common on mainland China / HMS). " +
              "Health Connect cannot be installed here."
          !playStoreAvailable ->
            "Health Connect provider update is required, but the Play Store app " +
              "is missing. Install Google Play Store, or open system Health Connect " +
              "settings on Android 14+."
          provider == "framework" ->
            "Health Connect is on-device but needs a provider update. " +
              "Open Health Connect settings or update via Play Store."
          else ->
            "Install or update the Health Connect app from Google Play " +
              "(Android 13 and below)."
        }
      else ->
        when {
          !googlePlayServicesAvailable ->
            "Health Connect is not available without Google Play services " +
              "(mainland China Play Storefront does not list Health Connect; " +
              "Huawei/HMS devices without GMS are unsupported)."
          provider == "none" ->
            "Health Connect requires Android 9 (API 28) or higher."
          else ->
            "Health Connect SDK is unavailable on this device. Hide HC features."
        }
    }
  }

  fun unavailableRejectMessage(
    sdkStatus: Int,
    googlePlayServicesAvailable: Boolean,
    playStoreAvailable: Boolean,
  ): String {
    val provider = providerKind()
    return buildAdvice(
      sdkStatus = sdkStatus,
      provider = provider,
      googlePlayServicesAvailable = googlePlayServicesAvailable,
      playStoreAvailable = playStoreAvailable,
    )
  }

  fun toJson(
    sdkStatus: Int,
    provider: String,
    googlePlayServicesAvailable: Boolean,
    playStoreAvailable: Boolean,
    androidSdkInt: Int,
  ): JSONObject {
    val status = mapStatus(sdkStatus)
    return JSONObject().apply {
      put("status", status)
      put("sdkStatus", sdkStatus)
      put("sdkStatusName", sdkStatusName(sdkStatus))
      put("provider", provider)
      put("androidSdkInt", androidSdkInt)
      put("googlePlayServicesAvailable", googlePlayServicesAvailable)
      put("playStoreAvailable", playStoreAvailable)
      put(
        "advice",
        buildAdvice(
          sdkStatus,
          provider,
          googlePlayServicesAvailable,
          playStoreAvailable,
        ),
      )
    }
  }

  fun sdkStatusName(sdkStatus: Int): String =
    when (sdkStatus) {
      HealthConnectClient.SDK_AVAILABLE -> "SDK_AVAILABLE"
      HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ->
        "SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED"
      HealthConnectClient.SDK_UNAVAILABLE -> "SDK_UNAVAILABLE"
      else -> "UNKNOWN_$sdkStatus"
    }
}
