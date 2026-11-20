package com.androidhealthconnect

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.changes.Change
import androidx.health.connect.client.changes.DeletionChange
import androidx.health.connect.client.changes.UpsertionChange
import androidx.health.connect.client.records.metadata.DataOrigin
import androidx.health.connect.client.request.ChangesTokenRequest
import org.json.JSONArray
import org.json.JSONObject

/**
 * Health Connect changelog helpers (`getChangesToken` / `getChanges`).
 *
 * Prefer one record type per token so a revoked permission does not invalidate
 * an entire multi-type token (official HC guidance).
 */
internal object ChangesMapper {

  suspend fun getChangesToken(client: HealthConnectClient, options: JSONObject): String {
    return client.getChangesToken(parseTokenRequest(options))
  }

  suspend fun getChanges(
    client: HealthConnectClient,
    changesToken: String,
    options: JSONObject = JSONObject(),
  ): JSONObject {
    requireToken(changesToken)
    val pageSize = parsePageSize(options)
    val response =
      if (pageSize != null) {
        client.getChanges(changesToken, pageSize)
      } else {
        client.getChanges(changesToken)
      }
    return responseToJson(
      changes = response.changes,
      nextChangesToken = response.nextChangesToken,
      hasMore = response.hasMore,
      changesTokenExpired = response.changesTokenExpired,
    )
  }

  fun parseTokenRequest(options: JSONObject): ChangesTokenRequest {
    val typesArr =
      options.optJSONArray("recordTypes")
        ?: throw IllegalArgumentException("recordTypes is required")
    if (typesArr.length() == 0) {
      throw IllegalArgumentException("recordTypes must not be empty")
    }
    val recordTypes =
      (0 until typesArr.length())
        .map { FeatureSupport.recordClassForType(typesArr.getString(it)) }
        .toSet()
    return ChangesTokenRequest(
      recordTypes = recordTypes,
      dataOriginFilters = parseDataOrigins(options.optJSONArray("dataOriginFilters")),
    )
  }

  fun requireToken(changesToken: String) {
    if (changesToken.isBlank()) {
      throw IllegalArgumentException("changesToken must not be empty")
    }
  }

  /** Soft page-size hint; null when omitted. Must be 1–5000 when set. */
  fun parsePageSize(options: JSONObject): Int? {
    if (!options.has("pageSize") || options.isNull("pageSize")) return null
    val size = options.getInt("pageSize")
    require(size in 1..5000) { "pageSize must be between 1 and 5000" }
    return size
  }

  fun responseToJson(
    changes: List<Change>,
    nextChangesToken: String,
    hasMore: Boolean,
    changesTokenExpired: Boolean,
  ): JSONObject {
    val upsertions = JSONArray()
    val deletions = JSONArray()
    changes.forEach { change ->
      when (change) {
        is UpsertionChange ->
          upsertions.put(JSONObject().put("record", RecordMapper.recordToJson(change.record)))
        is DeletionChange ->
          deletions.put(JSONObject().put("recordId", change.recordId))
        else -> Unit
      }
    }
    return JSONObject()
      .put("upsertionChanges", upsertions)
      .put("deletionChanges", deletions)
      .put("nextChangesToken", nextChangesToken)
      .put("hasMore", hasMore)
      .put("changesTokenExpired", changesTokenExpired)
  }

  private fun parseDataOrigins(arr: JSONArray?): Set<DataOrigin> {
    if (arr == null) return emptySet()
    return (0 until arr.length()).map { DataOrigin(arr.getString(it)) }.toSet()
  }
}
