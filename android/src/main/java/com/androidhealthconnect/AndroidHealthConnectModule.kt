package com.androidhealthconnect

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

class AndroidHealthConnectModule(reactContext: ReactApplicationContext) :
  NativeAndroidHealthConnectSpec(reactContext), ActivityEventListener {

  companion object {
    const val NAME = NativeAndroidHealthConnectSpec.NAME
    private const val PERMISSION_REQUEST_CODE = 21432
    private const val TAG = "AndroidHealthConnect"
    private const val HC_PACKAGE = "com.google.android.apps.healthdata"
    private const val HC_PLAY_STORE_URI =
      "https://play.google.com/store/apps/details?id=$HC_PACKAGE"
  }

  private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  /** Lazily obtained once we know HC is available. */
  private val healthConnectClient by lazy {
    HealthConnectClient.getOrCreate(reactApplicationContext)
  }

  /** Contract used to build the permissions intent and parse its result. */
  private val requestPermissionsContract =
    PermissionController.createRequestPermissionResultContract()

  /** Pending promise for an in-flight permission request. */
  @Volatile
  private var pendingPermissionPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  // ─── Availability ──────────────────────────────────────────────────────────

  override fun isHealthConnectAvailable(promise: Promise) {
    val status = HealthConnectClient.getSdkStatus(reactApplicationContext)
    val result = when (status) {
      HealthConnectClient.SDK_AVAILABLE -> "available"
      HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "notInstalled"
      else -> "notSupported"
    }
    promise.resolve(result)
  }

  // ─── Permissions ───────────────────────────────────────────────────────────

  override fun requestPermissions(permissions: ReadableArray, promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground Activity available")
      return
    }
    if (!isAvailable(promise)) return

    pendingPermissionPromise = promise
    val permSet = permissions.toArrayList().map { it.toString() }.toSet()
    val intent = requestPermissionsContract.createIntent(activity, permSet)
    activity.startActivityForResult(intent, PERMISSION_REQUEST_CODE)
  }

  override fun checkPermissions(permissions: ReadableArray, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        val requested = permissions.toArrayList().map { it.toString() }
        val result = Arguments.createArray()
        requested.filter { granted.contains(it) }.forEach { result.pushString(it) }
        promise.resolve(result)
      } catch (e: Exception) {
        promise.reject("CHECK_PERMISSIONS_ERROR", e.message, e)
      }
    }
  }

  override fun revokeAllPermissions(promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        healthConnectClient.permissionController.revokeAllPermissions()
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("REVOKE_PERMISSIONS_ERROR", e.message, e)
      }
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  override fun openHealthConnectSettings() {
    val intent = Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS").apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    startSafeActivity(intent)
  }

  override fun openHealthConnectDataManagement(packageName: String) {
    val intent = Intent("androidx.health.ACTION_MANAGE_HEALTH_PERMISSIONS").apply {
      if (packageName.isNotEmpty()) {
        putExtra(Intent.EXTRA_PACKAGE_NAME, packageName)
      }
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    startSafeActivity(intent)
  }

  override fun openHealthConnectApp() {
    val status = HealthConnectClient.getSdkStatus(reactApplicationContext)
    val intent = if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      Intent(Intent.ACTION_VIEW, Uri.parse(HC_PLAY_STORE_URI)).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    } else {
      Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS").apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
    }
    startSafeActivity(intent)
  }

  // ─── Records ───────────────────────────────────────────────────────────────

  override fun readRecords(recordType: String, options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val result = RecordMapper.readRecords(
          healthConnectClient, recordType, JSONObject(options)
        )
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "readRecords error", e)
        promise.reject("READ_RECORDS_ERROR", e.message, e)
      }
    }
  }

  override fun writeRecords(records: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val arr = JSONArray(records)
        val rnRecords = (0 until arr.length()).map { i ->
          RecordMapper.jsonToRecord(arr.getJSONObject(i))
        }
        val response = healthConnectClient.insertRecords(rnRecords)
        val result = JSONObject().apply {
          put("recordIdsList", org.json.JSONArray(response.recordIdsList))
        }
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "writeRecords error", e)
        promise.reject("WRITE_RECORDS_ERROR", e.message, e)
      }
    }
  }

  override fun deleteRecordsByTime(
    recordType: String,
    startTime: String,
    endTime: String,
    promise: Promise,
  ) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val filter = androidx.health.connect.client.time.TimeRangeFilter.between(
          Instant.parse(startTime), Instant.parse(endTime)
        )
        RecordMapper.deleteByTimeRange(healthConnectClient, recordType, filter)
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "deleteRecordsByTime error", e)
        promise.reject("DELETE_RECORDS_ERROR", e.message, e)
      }
    }
  }

  override fun deleteRecordsById(
    recordType: String,
    recordIds: ReadableArray,
    promise: Promise,
  ) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val ids = recordIds.toArrayList().map { it.toString() }
        RecordMapper.deleteByIds(healthConnectClient, recordType, ids)
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "deleteRecordsById error", e)
        promise.reject("DELETE_RECORDS_ERROR", e.message, e)
      }
    }
  }

  // ─── ActivityEventListener ────────────────────────────────────────────────

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?,
  ) {
    if (requestCode != PERMISSION_REQUEST_CODE) return
    val granted = requestPermissionsContract.parseResult(resultCode, data)
    val array = Arguments.createArray()
    granted.forEach { array.pushString(it) }
    pendingPermissionPromise?.resolve(array)
    pendingPermissionPromise = null
  }

  override fun onNewIntent(intent: Intent?) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    moduleScope.cancel()
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private fun isAvailable(promise: Promise): Boolean {
    val status = HealthConnectClient.getSdkStatus(reactApplicationContext)
    if (status != HealthConnectClient.SDK_AVAILABLE) {
      promise.reject(
        "HEALTH_CONNECT_UNAVAILABLE",
        if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
          "Health Connect is not installed. Call openHealthConnectApp() to install it."
        else
          "Health Connect is not supported on this device."
      )
      return false
    }
    return true
  }

  private fun startSafeActivity(intent: Intent) {
    try {
      reactApplicationContext.startActivity(intent)
    } catch (e: Exception) {
      Log.e(TAG, "Could not start activity: ${e.message}")
    }
  }
}
