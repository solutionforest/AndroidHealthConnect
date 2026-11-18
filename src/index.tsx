import NativeAndroidHealthConnect from './NativeAndroidHealthConnect';
import type {
  HealthConnectAvailability,
  HealthPermission,
  HealthRecord,
  RecordType,
  ReadRecordsOptions,
  ReadRecordsResponse,
  InsertRecordsResponse,
  StepsRecord,
  HeartRateRecord,
  SleepSessionRecord,
  ActiveCaloriesBurnedRecord,
  TotalCaloriesBurnedRecord,
  DistanceRecord,
  WeightRecord,
  HeightRecord,
  BloodPressureRecord,
  BloodGlucoseRecord,
  OxygenSaturationRecord,
  BodyTemperatureRecord,
  BodyFatRecord,
  HydrationRecord,
  ExerciseSessionRecord,
  RestingHeartRateRecord,
  RespiratoryRateRecord,
  FloorsClimbedRecord,
  ElevationGainedRecord,
  MindfulnessSessionRecord,
  SkinTemperatureRecord,
  ActivityIntensityRecord,
  HealthConnectFeature,
  FeatureStatus,
  MatchmakingRequest,
  MatchmakingPossibleResponse,
  CreateMedicalDataSourceRequest,
  MedicalDataSource,
  GetMedicalDataSourcesRequest,
  UpsertMedicalResourceRequest,
  MedicalResource,
  ReadMedicalResourcesRequest,
  ReadMedicalResourcesResponse,
  DeleteMedicalResourcesRequest,
} from './types';

export * from './types';
export { LIBRARY_VERSION, checkLibraryUpdate, compareSemver } from './upgrade';
export type { CheckLibraryUpdateOptions, LibraryUpdateInfo } from './upgrade';

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Returns the Health Connect availability status for this device.
 *
 * - `'available'`     – HC is ready to use.
 * - `'notInstalled'`  – HC app must be installed (Android 9-13).
 * - `'notSupported'`  – OS version is too old (< Android 9).
 */
export async function isHealthConnectAvailable(): Promise<HealthConnectAvailability> {
  const status = await NativeAndroidHealthConnect.isHealthConnectAvailable();
  return status as HealthConnectAvailability;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Opens the Health Connect permission dialog for the supplied permissions.
 * Returns the list of permissions actually granted by the user.
 */
export async function requestPermissions(
  permissions: HealthPermission[]
): Promise<HealthPermission[]> {
  const granted = await NativeAndroidHealthConnect.requestPermissions(
    permissions
  );
  return Array.from(granted) as HealthPermission[];
}

/**
 * Checks which of the supplied permissions are currently granted.
 * Returns only the granted subset.
 */
export async function checkPermissions(
  permissions: HealthPermission[]
): Promise<HealthPermission[]> {
  const granted = await NativeAndroidHealthConnect.checkPermissions(
    permissions
  );
  return Array.from(granted) as HealthPermission[];
}

/**
 * Revokes all Health Connect permissions granted to this application.
 */
export async function revokeAllPermissions(): Promise<void> {
  await NativeAndroidHealthConnect.revokeAllPermissions();
}

/** Opens the Health Connect main settings screen. */
export function openHealthConnectSettings(): void {
  NativeAndroidHealthConnect.openHealthConnectSettings();
}

/**
 * Opens the Health Connect data-management / permissions screen.
 * Pass your app's package name to jump directly to its permission page,
 * or omit / pass an empty string to open the general management screen.
 */
export function openHealthConnectDataManagement(packageName?: string): void {
  NativeAndroidHealthConnect.openHealthConnectDataManagement(packageName ?? '');
}

/**
 * Opens the Health Connect app.
 * If the HC app is not installed, opens the Play Store listing instead.
 */
export function openHealthConnectApp(): void {
  NativeAndroidHealthConnect.openHealthConnectApp();
}

// ─── Records – generic read / write / delete ─────────────────────────────────

/**
 * Reads health records of a specific type.
 *
 * @example
 * const { records } = await readRecords('Steps', {
 *   timeRangeFilter: { startTime: '2024-01-01T00:00:00Z', endTime: '2024-01-02T00:00:00Z' },
 * });
 */
export async function readRecords<T extends HealthRecord>(
  recordType: RecordType,
  options: ReadRecordsOptions = {}
): Promise<ReadRecordsResponse<T>> {
  const json = await NativeAndroidHealthConnect.readRecords(
    recordType,
    JSON.stringify(options)
  );
  return JSON.parse(json) as ReadRecordsResponse<T>;
}

/**
 * Inserts one or more health records into Health Connect.
 * Returns the IDs assigned by Health Connect.
 *
 * @example
 * const { recordIdsList } = await writeRecords([
 *   { recordType: 'Steps', count: 1000, startTime: '...', endTime: '...' },
 * ]);
 */
export async function writeRecords(
  records: HealthRecord[]
): Promise<InsertRecordsResponse> {
  const json = await NativeAndroidHealthConnect.writeRecords(
    JSON.stringify(records)
  );
  return JSON.parse(json) as InsertRecordsResponse;
}

/**
 * Deletes all records of the given type within the supplied time range.
 */
export async function deleteRecordsByTime(
  recordType: RecordType,
  startTime: string,
  endTime: string
): Promise<void> {
  await NativeAndroidHealthConnect.deleteRecordsByTime(
    recordType,
    startTime,
    endTime
  );
}

/**
 * Deletes specific records by their Health Connect IDs.
 */
export async function deleteRecordsById(
  recordType: RecordType,
  recordIds: string[]
): Promise<void> {
  await NativeAndroidHealthConnect.deleteRecordsById(recordType, recordIds);
}

// ─── Typed convenience helpers ────────────────────────────────────────────────

export const readSteps = (options?: ReadRecordsOptions) =>
  readRecords<StepsRecord>('Steps', options);

export const readHeartRate = (options?: ReadRecordsOptions) =>
  readRecords<HeartRateRecord>('HeartRate', options);

export const readSleepSessions = (options?: ReadRecordsOptions) =>
  readRecords<SleepSessionRecord>('SleepSession', options);

export const readActiveCaloriesBurned = (options?: ReadRecordsOptions) =>
  readRecords<ActiveCaloriesBurnedRecord>('ActiveCaloriesBurned', options);

export const readTotalCaloriesBurned = (options?: ReadRecordsOptions) =>
  readRecords<TotalCaloriesBurnedRecord>('TotalCaloriesBurned', options);

export const readDistance = (options?: ReadRecordsOptions) =>
  readRecords<DistanceRecord>('Distance', options);

export const readWeight = (options?: ReadRecordsOptions) =>
  readRecords<WeightRecord>('Weight', options);

export const readHeight = (options?: ReadRecordsOptions) =>
  readRecords<HeightRecord>('Height', options);

export const readBloodPressure = (options?: ReadRecordsOptions) =>
  readRecords<BloodPressureRecord>('BloodPressure', options);

export const readBloodGlucose = (options?: ReadRecordsOptions) =>
  readRecords<BloodGlucoseRecord>('BloodGlucose', options);

export const readOxygenSaturation = (options?: ReadRecordsOptions) =>
  readRecords<OxygenSaturationRecord>('OxygenSaturation', options);

export const readBodyTemperature = (options?: ReadRecordsOptions) =>
  readRecords<BodyTemperatureRecord>('BodyTemperature', options);

export const readBodyFat = (options?: ReadRecordsOptions) =>
  readRecords<BodyFatRecord>('BodyFat', options);

export const readHydration = (options?: ReadRecordsOptions) =>
  readRecords<HydrationRecord>('Hydration', options);

export const readExerciseSessions = (options?: ReadRecordsOptions) =>
  readRecords<ExerciseSessionRecord>('ExerciseSession', options);

export const readRestingHeartRate = (options?: ReadRecordsOptions) =>
  readRecords<RestingHeartRateRecord>('RestingHeartRate', options);

export const readRespiratoryRate = (options?: ReadRecordsOptions) =>
  readRecords<RespiratoryRateRecord>('RespiratoryRate', options);

export const readFloorsClimbed = (options?: ReadRecordsOptions) =>
  readRecords<FloorsClimbedRecord>('FloorsClimbed', options);

export const readElevationGained = (options?: ReadRecordsOptions) =>
  readRecords<ElevationGainedRecord>('ElevationGained', options);

export const readMindfulnessSessions = (options?: ReadRecordsOptions) =>
  readRecords<MindfulnessSessionRecord>('MindfulnessSession', options);

export const readSkinTemperature = (options?: ReadRecordsOptions) =>
  readRecords<SkinTemperatureRecord>('SkinTemperature', options);

export const readActivityIntensity = (options?: ReadRecordsOptions) =>
  readRecords<ActivityIntensityRecord>('ActivityIntensity', options);

// ─── Feature availability ─────────────────────────────────────────────────────

/**
 * Returns whether a Health Connect feature is available on this device.
 * Prefer checking before using alpha-gated APIs (skin temperature, mindfulness,
 * activity intensity, matchmaking, personal health record).
 */
export async function getFeatureStatus(
  feature: HealthConnectFeature
): Promise<FeatureStatus> {
  const status = await NativeAndroidHealthConnect.getFeatureStatus(feature);
  return status as FeatureStatus;
}

// ─── Matchmaking (experimental) ───────────────────────────────────────────────

/**
 * Returns whether the Matchmaking UI can show apps/devices that write data
 * this app has permission to read. Requires FEATURE_MATCHMAKING.
 */
export async function checkIfMatchmakingIsPossible(
  options: MatchmakingRequest = {}
): Promise<MatchmakingPossibleResponse> {
  const json = await NativeAndroidHealthConnect.checkIfMatchmakingIsPossible(
    JSON.stringify(options)
  );
  return JSON.parse(json) as MatchmakingPossibleResponse;
}

/**
 * Launches the Health Connect Matchmaking flow.
 * Resolves `true` when the user finishes successfully (RESULT_OK).
 * Requires FEATURE_MATCHMAKING and granted read permissions for the requested types.
 */
export async function launchMatchmaking(
  options: MatchmakingRequest = {}
): Promise<boolean> {
  return NativeAndroidHealthConnect.launchMatchmaking(JSON.stringify(options));
}

// ─── Personal Health Record / medical (experimental) ──────────────────────────

/** Creates a MedicalDataSource. Requires FEATURE_PERSONAL_HEALTH_RECORD. */
export async function createMedicalDataSource(
  request: CreateMedicalDataSourceRequest
): Promise<MedicalDataSource> {
  const json = await NativeAndroidHealthConnect.createMedicalDataSource(
    JSON.stringify(request)
  );
  return JSON.parse(json) as MedicalDataSource;
}

/** Deletes a MedicalDataSource and all MedicalResources written under it. */
export async function deleteMedicalDataSourceWithData(
  id: string
): Promise<void> {
  await NativeAndroidHealthConnect.deleteMedicalDataSourceWithData(id);
}

/** Lists MedicalDataSources visible to this app. */
export async function getMedicalDataSources(
  request: GetMedicalDataSourcesRequest = {}
): Promise<MedicalDataSource[]> {
  const json = await NativeAndroidHealthConnect.getMedicalDataSources(
    JSON.stringify(request)
  );
  return JSON.parse(json) as MedicalDataSource[];
}

/** Inserts or updates FHIR MedicalResources. */
export async function upsertMedicalResources(
  requests: UpsertMedicalResourceRequest[]
): Promise<MedicalResource[]> {
  const json = await NativeAndroidHealthConnect.upsertMedicalResources(
    JSON.stringify(requests)
  );
  return JSON.parse(json) as MedicalResource[];
}

/**
 * Reads MedicalResources by type (first page) or by pageToken (subsequent pages).
 */
export async function readMedicalResources(
  request: ReadMedicalResourcesRequest
): Promise<ReadMedicalResourcesResponse> {
  const json = await NativeAndroidHealthConnect.readMedicalResources(
    JSON.stringify(request)
  );
  return JSON.parse(json) as ReadMedicalResourcesResponse;
}

/** Deletes MedicalResources by id list or by data-source / type filter. */
export async function deleteMedicalResources(
  request: DeleteMedicalResourcesRequest
): Promise<void> {
  await NativeAndroidHealthConnect.deleteMedicalResources(
    JSON.stringify(request)
  );
}
