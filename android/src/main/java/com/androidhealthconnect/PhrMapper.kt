package com.androidhealthconnect

import android.net.Uri
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.feature.ExperimentalPersonalHealthRecordApi
import androidx.health.connect.client.records.FhirResource
import androidx.health.connect.client.records.FhirVersion
import androidx.health.connect.client.records.MedicalDataSource
import androidx.health.connect.client.records.MedicalResource
import androidx.health.connect.client.records.MedicalResourceId
import androidx.health.connect.client.request.CreateMedicalDataSourceRequest
import androidx.health.connect.client.request.DeleteMedicalResourcesRequest
import androidx.health.connect.client.request.GetMedicalDataSourcesRequest
import androidx.health.connect.client.request.ReadMedicalResourcesInitialRequest
import androidx.health.connect.client.request.ReadMedicalResourcesPageRequest
import androidx.health.connect.client.request.UpsertMedicalResourceRequest
import org.json.JSONArray
import org.json.JSONObject

@OptIn(ExperimentalPersonalHealthRecordApi::class)
internal object PhrMapper {

  fun fhirVersionFromJson(json: JSONObject): FhirVersion =
    FhirVersion(
      json.getInt("major"),
      json.getInt("minor"),
      json.getInt("patch"),
    )

  fun fhirVersionToJson(version: FhirVersion): JSONObject =
    JSONObject().apply {
      put("major", version.major)
      put("minor", version.minor)
      put("patch", version.patch)
    }

  fun medicalDataSourceToJson(source: MedicalDataSource): JSONObject =
    JSONObject().apply {
      put("id", source.id)
      put("displayName", source.displayName)
      put("fhirBaseUri", source.fhirBaseUri.toString())
      put("fhirVersion", fhirVersionToJson(source.fhirVersion))
      put("packageName", source.packageName)
    }

  fun medicalResourceIdToJson(id: MedicalResourceId): JSONObject =
    JSONObject().apply {
      put("dataSourceId", id.dataSourceId)
      put("fhirResourceType", id.fhirResourceType)
      put("fhirResourceId", id.fhirResourceId)
    }

  fun medicalResourceIdFromJson(json: JSONObject): MedicalResourceId =
    MedicalResourceId(
      dataSourceId = json.getString("dataSourceId"),
      fhirResourceType = json.getInt("fhirResourceType"),
      fhirResourceId = json.getString("fhirResourceId"),
    )

  fun fhirResourceToJson(resource: FhirResource): JSONObject =
    JSONObject().apply {
      put("type", resource.type)
      put("id", resource.id)
      put("data", resource.data)
    }

  fun medicalResourceToJson(resource: MedicalResource): JSONObject =
    JSONObject().apply {
      put("type", resource.type)
      put("id", medicalResourceIdToJson(resource.id))
      put("dataSourceId", resource.dataSourceId)
      put("fhirVersion", fhirVersionToJson(resource.fhirVersion))
      put("fhirResource", fhirResourceToJson(resource.fhirResource))
    }

  fun createRequestFromJson(json: JSONObject): CreateMedicalDataSourceRequest =
    CreateMedicalDataSourceRequest(
      fhirBaseUri = Uri.parse(json.getString("fhirBaseUri")),
      displayName = json.getString("displayName"),
      fhirVersion = fhirVersionFromJson(json.getJSONObject("fhirVersion")),
    )

  fun upsertRequestsFromJson(arr: JSONArray): List<UpsertMedicalResourceRequest> =
    (0 until arr.length()).map { i ->
      val j = arr.getJSONObject(i)
      UpsertMedicalResourceRequest(
        dataSourceId = j.getString("dataSourceId"),
        fhirVersion = fhirVersionFromJson(j.getJSONObject("fhirVersion")),
        data = j.getString("data"),
      )
    }

  suspend fun getMedicalDataSources(
    client: HealthConnectClient,
    options: JSONObject,
  ): JSONArray {
    val idsArr = options.optJSONArray("medicalDataSourceIds")
    val sources =
      if (idsArr != null && idsArr.length() > 0) {
        val ids = (0 until idsArr.length()).map { idsArr.getString(it) }
        client.getMedicalDataSources(ids)
      } else {
        val packagesArr = options.optJSONArray("packageNames")
        val packageNames =
          if (packagesArr != null) {
            (0 until packagesArr.length()).map { packagesArr.getString(it) }
          } else {
            emptyList()
          }
        client.getMedicalDataSources(GetMedicalDataSourcesRequest(packageNames))
      }
    return JSONArray().apply {
      sources.forEach { put(medicalDataSourceToJson(it)) }
    }
  }

  suspend fun readMedicalResources(
    client: HealthConnectClient,
    options: JSONObject,
  ): JSONObject {
    val pageToken = options.optString("pageToken", "").ifEmpty { null }
    val pageSize = options.optInt("pageSize", 100)
    val request =
      if (pageToken != null) {
        ReadMedicalResourcesPageRequest(pageToken = pageToken, pageSize = pageSize)
      } else {
        val type = options.getInt("medicalResourceType")
        val sourceIdsArr = options.optJSONArray("medicalDataSourceIds")
        val sourceIds =
          if (sourceIdsArr != null) {
            (0 until sourceIdsArr.length()).map { sourceIdsArr.getString(it) }.toSet()
          } else {
            emptySet()
          }
        ReadMedicalResourcesInitialRequest(
          medicalResourceType = type,
          medicalDataSourceIds = sourceIds,
          pageSize = pageSize,
        )
      }
    val response = client.readMedicalResources(request)
    return JSONObject().apply {
      put(
        "medicalResources",
        JSONArray().apply {
          response.medicalResources.forEach { put(medicalResourceToJson(it)) }
        },
      )
      put("nextPageToken", response.nextPageToken ?: JSONObject.NULL)
    }
  }

  suspend fun deleteMedicalResources(
    client: HealthConnectClient,
    options: JSONObject,
  ) {
    val idsArr = options.optJSONArray("ids")
    if (idsArr != null && idsArr.length() > 0) {
      val ids =
        (0 until idsArr.length()).map {
          medicalResourceIdFromJson(idsArr.getJSONObject(it))
        }
      client.deleteMedicalResources(ids)
      return
    }
    val dataSourceIdsArr = options.optJSONArray("dataSourceIds")
    val typesArr = options.optJSONArray("medicalResourceTypes")
    val dataSourceIds =
      if (dataSourceIdsArr != null) {
        (0 until dataSourceIdsArr.length()).map { dataSourceIdsArr.getString(it) }.toSet()
      } else {
        emptySet()
      }
    val types =
      if (typesArr != null) {
        (0 until typesArr.length()).map { typesArr.getInt(it) }.toSet()
      } else {
        emptySet()
      }
    client.deleteMedicalResources(
      DeleteMedicalResourcesRequest(
        dataSourceIds = dataSourceIds,
        medicalResourceTypes = types,
      )
    )
  }
}
