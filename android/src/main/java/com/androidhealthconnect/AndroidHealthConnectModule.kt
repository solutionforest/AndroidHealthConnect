package com.androidhealthconnect

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.health.connect.client.ExperimentalMatchmakingApi
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.contracts.ExerciseRouteRequestContract
import androidx.health.connect.client.feature.ExperimentalPersonalHealthRecordApi
import androidx.health.connect.client.matchmaking.MatchmakingRequest
import androidx.health.connect.client.records.ExerciseRoute
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
    private const val EXERCISE_ROUTE_REQUEST_CODE = 21434
    private const val TAG = "AndroidHealthConnect"
  }

  private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  /** Lazily obtained once we know HC is available. */
  private val healthConnectClient by lazy {
    HealthConnectClient.getOrCreate(reactApplicationContext)
  }

  /** Contract used to build the permissions intent and parse its result. */
  private val requestPermissionsContract =
    PermissionController.createRequestPermissionResultContract()

  private val exerciseRouteRequestContract = ExerciseRouteRequestContract()

  /** Pending promise for an in-flight permission request. */
  @Volatile
  private var pendingPermissionPromise: Promise? = null

  /** Pending promise for an in-flight matchmaking flow. */
  @Volatile
  private var pendingMatchmakingPromise: Promise? = null

  /** Pending promise for an in-flight exercise-route consent flow. */
  @Volatile
  private var pendingExerciseRoutePromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
  }

  // ─── Availability ──────────────────────────────────────────────────────────

  override fun isHealthConnectAvailable(promise: Promise) {
    val status = HealthConnectClient.getSdkStatus(reactApplicationContext)
    promise.resolve(AvailabilitySupport.mapStatus(status))
  }

  override fun getHealthConnectAvailability(promise: Promise) {
    val ctx = reactApplicationContext
    val sdkStatus = HealthConnectClient.getSdkStatus(ctx)
    val json =
      AvailabilitySupport.toJson(
        sdkStatus = sdkStatus,
        provider = AvailabilitySupport.providerKind(),
        googlePlayServicesAvailable =
          AvailabilitySupport.isPackageInstalled(ctx, AvailabilitySupport.GMS_PACKAGE),
        playStoreAvailable =
          AvailabilitySupport.isPackageInstalled(ctx, AvailabilitySupport.PLAY_STORE_PACKAGE),
        androidSdkInt = Build.VERSION.SDK_INT,
      )
    promise.resolve(json.toString())
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
    val ctx = reactApplicationContext
    val status = HealthConnectClient.getSdkStatus(ctx)
    if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      val hasPlayStore =
        AvailabilitySupport.isPackageInstalled(ctx, AvailabilitySupport.PLAY_STORE_PACKAGE)
      if (hasPlayStore) {
        // Official sample: market:// via Play Store package, with HTTPS fallback.
        val market =
          Intent(Intent.ACTION_VIEW, Uri.parse(AvailabilitySupport.HC_PLAY_MARKET)).apply {
            setPackage(AvailabilitySupport.PLAY_STORE_PACKAGE)
            putExtra("overlay", true)
            putExtra("callerId", ctx.packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        if (startSafeActivity(market)) {
          return
        }
        startSafeActivity(
          Intent(Intent.ACTION_VIEW, Uri.parse(AvailabilitySupport.HC_PLAY_HTTPS)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
        )
        return
      }
      // No Play Store (common on mainland China / some HMS devices).
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        startSafeActivity(healthConnectSettingsIntent())
      } else {
        Log.w(
          TAG,
          "Health Connect install required but Play Store is missing (no GMS / China ROM)."
        )
      }
      return
    }
    startSafeActivity(healthConnectSettingsIntent())
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

  override fun updateRecords(records: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val arr = JSONArray(records)
        val rnRecords =
          (0 until arr.length()).map { i ->
            val json = arr.getJSONObject(i)
            RecordMapper.requireMetadataIdForUpdate(json)
            RecordMapper.jsonToRecord(json)
          }
        healthConnectClient.updateRecords(rnRecords)
        promise.resolve(true)
      } catch (e: Exception) {
        Log.e(TAG, "updateRecords error", e)
        promise.reject("UPDATE_RECORDS_ERROR", e.message, e)
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

  // ─── Aggregates ────────────────────────────────────────────────────────────

  override fun aggregateRecord(options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val result = AggregateMapper.aggregate(healthConnectClient, JSONObject(options))
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "aggregateRecord error", e)
        promise.reject("AGGREGATE_ERROR", e.message, e)
      }
    }
  }

  override fun aggregateGroupByDuration(options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val result =
          AggregateMapper.aggregateGroupByDuration(healthConnectClient, JSONObject(options))
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "aggregateGroupByDuration error", e)
        promise.reject("AGGREGATE_DURATION_ERROR", e.message, e)
      }
    }
  }

  override fun aggregateGroupByPeriod(options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val result =
          AggregateMapper.aggregateGroupByPeriod(healthConnectClient, JSONObject(options))
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "aggregateGroupByPeriod error", e)
        promise.reject("AGGREGATE_PERIOD_ERROR", e.message, e)
      }
    }
  }

  // ─── Changelog / changes token ────────────────────────────────────────────

  override fun getChangesToken(options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val token = ChangesMapper.getChangesToken(healthConnectClient, JSONObject(options))
        promise.resolve(token)
      } catch (e: Exception) {
        Log.e(TAG, "getChangesToken error", e)
        promise.reject("CHANGES_TOKEN_ERROR", e.message, e)
      }
    }
  }

  override fun getChanges(changesToken: String, options: String, promise: Promise) {
    if (!isAvailable(promise)) return
    moduleScope.launch {
      try {
        val opts = if (options.isBlank()) JSONObject() else JSONObject(options)
        val result = ChangesMapper.getChanges(healthConnectClient, changesToken, opts)
        promise.resolve(result.toString())
      } catch (e: Exception) {
        Log.e(TAG, "getChanges error", e)
        promise.reject("CHANGES_ERROR", e.message, e)
      }
    }
  }

  // ─── Exercise route consent ───────────────────────────────────────────────

  override fun requestExerciseRoute(recordId: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground Activity available")
      return
    }
    if (!isAvailable(promise)) return
    if (recordId.isBlank()) {
      promise.reject("INVALID_RECORD_ID", "Exercise session recordId must not be empty")
      return
    }

    pendingExerciseRoutePromise = promise
    try {
      val intent = exerciseRouteRequestContract.createIntent(activity, recordId)
      activity.startActivityForResult(intent, EXERCISE_ROUTE_REQUEST_CODE)
    } catch (e: Exception) {
      pendingExerciseRoutePromise = null
      Log.e(TAG, "requestExerciseRoute error", e)
      promise.reject("EXERCISE_ROUTE_ERROR", e.message, e)
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
      EXERCISE_ROUTE_REQUEST_CODE -> {
        val route: ExerciseRoute? =
          exerciseRouteRequestContract.parseResult(resultCode, data)
        if (route != null) {
          pendingExerciseRoutePromise?.resolve(
            RecordMapper.exerciseRouteDataToJson(route).toString()
          )
        } else {
          // Denied or no route — empty string so JS maps to null.
          pendingExerciseRoutePromise?.resolve("")
        }
        pendingExerciseRoutePromise = null
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
    val ctx = reactApplicationContext
    val status = HealthConnectClient.getSdkStatus(ctx)
    if (status != HealthConnectClient.SDK_AVAILABLE) {
      val message =
        AvailabilitySupport.unavailableRejectMessage(
          sdkStatus = status,
          googlePlayServicesAvailable =
            AvailabilitySupport.isPackageInstalled(ctx, AvailabilitySupport.GMS_PACKAGE),
          playStoreAvailable =
            AvailabilitySupport.isPackageInstalled(ctx, AvailabilitySupport.PLAY_STORE_PACKAGE),
        )
      promise.reject("HEALTH_CONNECT_UNAVAILABLE", message)
      return false
    }
    return true
  }

  private fun healthConnectSettingsIntent(): Intent =
    Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS").apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

  /** @return true when an activity was started. */
  private fun startSafeActivity(intent: Intent): Boolean {
    return try {
      reactApplicationContext.startActivity(intent)
      true
    } catch (e: Exception) {
      Log.e(TAG, "Could not start activity: ${e.message}")
      false
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
