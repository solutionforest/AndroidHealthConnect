package com.androidhealthconnect

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.health.connect.client.ExperimentalMatchmakingApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.feature.ExperimentalPersonalHealthRecordApi
import androidx.health.connect.client.matchmaking.MatchmakingRequest
import androidx.health.connect.client.records.metadata.DataOrigin
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

@OptIn(ExperimentalMatchmakingApi::class, ExperimentalPersonalHealthRecordApi::class)
class AndroidHealthConnectModule(reactContext: ReactApplicationContext) :
  NativeAndroidHealthConnectSpec(reactContext), ActivityEventListener {

  companion object {
    const val NAME = NativeAndroidHealthConnectSpec.NAME
    private const val PERMISSION_REQUEST_CODE = 21432
    private const val MATCHMAKING_REQUEST_CODE = 21433
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

  /** Pending promise for an in-flight matchmaking flow. */
  @Volatile
  private var pendingMatchmakingPromise: Promise? = null

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
    val activity = reactApplicationContext.currentActivity
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

  // ─── Feature availability ─────────────────────────────────────────────────

  override fun getFeatureStatus(feature: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        promise.resolve(FeatureSupport.getStatus(healthConnectClient, feature))
      } catch (e: Exception) {
        promise.reject("FEATURE_STATUS_ERROR", e.message, e)
      }
    }
  }

  // ─── Matchmaking ──────────────────────────────────────────────────────────

  override fun checkIfMatchmakingIsPossible(options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val request = parseMatchmakingRequest(JSONObject(options))
        val response = healthConnectClient.checkIfMatchmakingIsPossible(request)
        promise.resolve(
          JSONObject().put("isMatchmakingPossible", response.isMatchmakingPossible).toString()
        )
      } catch (e: Exception) {
        Log.e(TAG, "checkIfMatchmakingIsPossible error", e)
        promise.reject("MATCHMAKING_ERROR", e.message, e)
      }
    }
  }

  override fun launchMatchmaking(options: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground Activity available")
      return
    }
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val request = parseMatchmakingRequest(JSONObject(options))
        val intent = healthConnectClient.createMatchmakingIntent(request)
        pendingMatchmakingPromise = promise
        activity.runOnUiThread {
          activity.startActivityForResult(intent, MATCHMAKING_REQUEST_CODE)
        }
      } catch (e: Exception) {
        Log.e(TAG, "launchMatchmaking error", e)
        promise.reject("MATCHMAKING_ERROR", e.message, e)
      }
    }
  }

  // ─── Personal Health Record ───────────────────────────────────────────────

  override fun createMedicalDataSource(request: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val source = healthConnectClient.createMedicalDataSource(
          PhrMapper.createRequestFromJson(JSONObject(request))
        )
        promise.resolve(PhrMapper.medicalDataSourceToJson(source).toString())
      } catch (e: Exception) {
        Log.e(TAG, "createMedicalDataSource error", e)
        promise.reject("PHR_ERROR", e.message, e)
      }
    }
  }

  override fun deleteMedicalDataSourceWithData(id: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        healthConnectClient.deleteMedicalDataSourceWithData(id)
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "deleteMedicalDataSourceWithData error", e)
        promise.reject("PHR_ERROR", e.message, e)
      }
    }
  }

  override fun getMedicalDataSources(request: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val result = PhrMapper.getMedicalDataSources(
          healthConnectClient, JSONObject(request.ifEmpty { "{}" })
        )
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "getMedicalDataSources error", e)
        promise.reject("PHR_ERROR", e.message, e)
      }
    }
  }

  override fun upsertMedicalResources(requests: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val upserted = healthConnectClient.upsertMedicalResources(
          PhrMapper.upsertRequestsFromJson(JSONArray(requests))
        )
        val arr = JSONArray().apply {
          upserted.forEach { put(PhrMapper.medicalResourceToJson(it)) }
        }
        promise.resolve(arr.toString())
      } catch (e: Exception) {
        Log.e(TAG, "upsertMedicalResources error", e)
        promise.reject("PHR_ERROR", e.message, e)
      }
    }
  }

  override fun readMedicalResources(request: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val result = PhrMapper.readMedicalResources(
          healthConnectClient, JSONObject(request)
        )
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "readMedicalResources error", e)
        promise.reject("PHR_ERROR", e.message, e)
      }
    }
  }

  override fun deleteMedicalResources(request: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        PhrMapper.deleteMedicalResources(healthConnectClient, JSONObject(request))
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "deleteMedicalResources error", e)
        promise.reject("PHR_ERROR", e.message, e)
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
    when (requestCode) {
      PERMISSION_REQUEST_CODE -> {
        val granted = requestPermissionsContract.parseResult(resultCode, data)
        val array = Arguments.createArray()
        granted.forEach { array.pushString(it) }
        pendingPermissionPromise?.resolve(array)
        pendingPermissionPromise = null
      }
      MATCHMAKING_REQUEST_CODE -> {
        pendingMatchmakingPromise?.resolve(resultCode == Activity.RESULT_OK)
        pendingMatchmakingPromise = null
      }
    }
  }

  override fun onNewIntent(intent: Intent) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  override fun invalidate() {
    reactApplicationContext.removeActivityEventListener(this)
    moduleScope.cancel()
    super.invalidate()
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

  private fun parseMatchmakingRequest(options: JSONObject): MatchmakingRequest {
    val recordTypesArr = options.optJSONArray("recordTypes")
    val recordTypes =
      if (recordTypesArr != null) {
        (0 until recordTypesArr.length())
          .map { FeatureSupport.recordClassForType(recordTypesArr.getString(it)) }
          .toSet()
      } else {
        emptySet()
      }
    val included = parseDataOrigins(options.optJSONArray("includedDataSources"))
    val excluded = parseDataOrigins(options.optJSONArray("excludedDataSources"))
    return MatchmakingRequest(
      recordTypes = recordTypes,
      includedDataSources = included,
      excludedDataSources = excluded,
    )
  }

  private fun parseDataOrigins(arr: JSONArray?): Set<DataOrigin> {
    if (arr == null) return emptySet()
    return (0 until arr.length()).map { DataOrigin(arr.getString(it)) }.toSet()
  }
}
