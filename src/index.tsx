import NativeAndroidHealthConnect from './NativeAndroidHealthConnect';
import type {
  HealthConnectAvailability,
  HealthConnectAvailabilityInfo,
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
  PlannedExerciseSessionRecord,
  RestingHeartRateRecord,
  RespiratoryRateRecord,
  FloorsClimbedRecord,
  ElevationGainedRecord,
  MindfulnessSessionRecord,
  SkinTemperatureRecord,
  ActivityIntensityRecord,
  NutritionRecord,
  Vo2MaxRecord,
  SpeedRecord,
  PowerRecord,
  StepsCadenceRecord,
  CyclingPedalingCadenceRecord,
  WheelchairPushesRecord,
  MenstruationFlowRecord,
  MenstruationPeriodRecord,
  OvulationTestRecord,
  CervicalMucusRecord,
  IntermenstrualBleedingRecord,
  SexualActivityRecord,
  BasalBodyTemperatureRecord,
  LeanBodyMassRecord,
  BoneMassRecord,
  BodyWaterMassRecord,
  BasalMetabolicRateRecord,
  HeartRateVariabilityRmssdRecord,
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
  AggregateRequest,
  AggregateResult,
  AggregateGroupByDurationRequest,
  AggregateGroupByPeriodRequest,
  AggregationResultGroupedByDuration,
  AggregationResultGroupedByPeriod,
  ExerciseRouteRead,
  GetChangesTokenRequest,
  GetChangesOptions,
  GetChangesResponse,
} from './types';

export * from './types';
export { LIBRARY_VERSION, checkLibraryUpdate, compareSemver } from './upgrade';
export type { CheckLibraryUpdateOptions, LibraryUpdateInfo } from './upgrade';
export {
  ensurePermissions,
  timeRangeLastHours,
  timeRangeLastDays,
  timeRangeToday,
  pollUntil,
  waitUntil,
  waitForRecords,
  WaitTimeoutError,
  WaitForRecordsTimeoutError,
  readAllRecords,
  pullChanges,
} from './helpers';
export type {
  EnsurePermissionsResult,
  WaitForRecordsOptions,
  PollUntilOptions,
  PollUntilResult,
  PullChangesResult,
} from './helpers';
export { pollOnForeground, useForegroundPoll } from './foreground';
export type {
  PollOnForegroundOptions,
  ForegroundPoller,
  UseForegroundPollOptions,
  UseForegroundPollState,
} from './foreground';

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Returns the Health Connect availability status for this device.
 *
 * - `'available'`     – HC is ready (`sdkStatus` 3 = SDK_AVAILABLE).
 * - `'notInstalled'`  – install/update HC provider (`sdkStatus` 2).
 * - `'notSupported'`  – OS too old, no GMS / China / HMS, or otherwise unusable (`sdkStatus` 1).
 *
 * Prefer {@link getHealthConnectAvailability} when you need provider / GMS details.
 */
export async function isHealthConnectAvailable(): Promise<HealthConnectAvailability> {
  const status = await NativeAndroidHealthConnect.isHealthConnectAvailable();
  return status as HealthConnectAvailability;
}

/**
 * Detailed availability: built-in (Android 14+) vs Play APK, GMS / Play Store
 * presence, raw sdkStatus, and human-readable advice (incl. China / HMS).
 */
export async function getHealthConnectAvailability(): Promise<HealthConnectAvailabilityInfo> {
  const json = await NativeAndroidHealthConnect.getHealthConnectAvailability();
  return JSON.parse(json) as HealthConnectAvailabilityInfo;
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
 * True when every permission in `permissions` is currently granted.
 */
export async function hasPermissions(
  permissions: HealthPermission[]
): Promise<boolean> {
  if (permissions.length === 0) {
    return true;
  }
  const granted = await checkPermissions(permissions);
  const grantedSet = new Set(granted);
  return permissions.every((p) => grantedSet.has(p));
}

/**
 * Permissions from `permissions` that are not currently granted.
 */
export async function missingPermissions(
  permissions: HealthPermission[]
): Promise<HealthPermission[]> {
  if (permissions.length === 0) {
    return [];
  }
  const granted = await checkPermissions(permissions);
  const grantedSet = new Set(granted);
  return permissions.filter((p) => !grantedSet.has(p));
}

/**
 * Quick availability gate. Returns the status; when `notInstalled` and
 * `openStoreIfMissing` is true (default), opens Play Store / Settings via
 * {@link openHealthConnectApp}.
 */
export async function ensureAvailable(
  options: { openStoreIfMissing?: boolean } = {}
): Promise<HealthConnectAvailability> {
  const { openStoreIfMissing = true } = options;
  const status = await isHealthConnectAvailable();
  if (status === 'notInstalled' && openStoreIfMissing) {
    openHealthConnectApp();
  }
  return status;
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
 * Updates existing Health Connect records. Each record must include
 * `metadata.id` from a previous read (or insert response + re-read).
 */
export async function updateRecords(records: HealthRecord[]): Promise<void> {
  await NativeAndroidHealthConnect.updateRecords(JSON.stringify(records));
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

// ─── Aggregates ───────────────────────────────────────────────────────────────

/**
 * Aggregates metrics for a record type over a time range (Instant filter).
 * Metric keys follow Health Connect (`COUNT_TOTAL`, `BPM_AVG`, …).
 */
export async function aggregateRecord(
  request: AggregateRequest
): Promise<AggregateResult> {
  const json = await NativeAndroidHealthConnect.aggregateRecord(
    JSON.stringify(request)
  );
  return JSON.parse(json) as AggregateResult;
}

/**
 * Aggregates into fixed-duration buckets using Instant time ranges
 * (avoids Android 14+ UTC wall-clock shift with LocalDateTime).
 */
export async function aggregateGroupByDuration(
  request: AggregateGroupByDurationRequest
): Promise<AggregationResultGroupedByDuration[]> {
  const json = await NativeAndroidHealthConnect.aggregateGroupByDuration(
    JSON.stringify(request)
  );
  return JSON.parse(json) as AggregationResultGroupedByDuration[];
}

/**
 * Aggregates into calendar period buckets (days/weeks/months/years).
 * Instant inputs are converted to LocalDateTime in the device zone
 * (required by Health Connect for period grouping).
 */
export async function aggregateGroupByPeriod(
  request: AggregateGroupByPeriodRequest
): Promise<AggregationResultGroupedByPeriod[]> {
  const json = await NativeAndroidHealthConnect.aggregateGroupByPeriod(
    JSON.stringify(request)
  );
  return JSON.parse(json) as AggregationResultGroupedByPeriod[];
}

// ─── Changelog / changes token ────────────────────────────────────────────────

/**
 * Returns a changes token for the given record types (valid ~30 days).
 * Prefer one type per token so a revoked permission cannot invalidate others.
 */
export async function getChangesToken(
  request: GetChangesTokenRequest
): Promise<string> {
  return NativeAndroidHealthConnect.getChangesToken(JSON.stringify(request));
}

/**
 * Fetches upserts/deletes since `changesToken`. Loop while `hasMore`;
 * persist `nextChangesToken`. If `changesTokenExpired`, backfill then mint a
 * new token via {@link getChangesToken}.
 *
 * Optional `pageSize` (1–5000) is a soft hint for changelog page size.
 */
export async function getChanges(
  changesToken: string,
  options: GetChangesOptions = {}
): Promise<GetChangesResponse> {
  const json = await NativeAndroidHealthConnect.getChanges(
    changesToken,
    JSON.stringify(options)
  );
  return JSON.parse(json) as GetChangesResponse;
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

/** Requires `getFeatureStatus('plannedExercise') === 'available'`. */
export const readPlannedExerciseSessions = (options?: ReadRecordsOptions) =>
  readRecords<PlannedExerciseSessionRecord>('PlannedExerciseSession', options);

/**
 * Requests one-time consent to read a session's exercise route when
 * `exerciseRoute.type === 'CONSENT_REQUIRED'`. Returns the route on grant,
 * or `null` if the user denies / no route exists.
 */
export async function requestExerciseRoute(
  recordId: string
): Promise<ExerciseRouteRead | null> {
  const json = await NativeAndroidHealthConnect.requestExerciseRoute(recordId);
  if (!json) {
    return null;
  }
  return JSON.parse(json) as ExerciseRouteRead;
}

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

export const readNutrition = (options?: ReadRecordsOptions) =>
  readRecords<NutritionRecord>('Nutrition', options);

export const readVo2Max = (options?: ReadRecordsOptions) =>
  readRecords<Vo2MaxRecord>('Vo2Max', options);

export const readSpeed = (options?: ReadRecordsOptions) =>
  readRecords<SpeedRecord>('Speed', options);

export const readPower = (options?: ReadRecordsOptions) =>
  readRecords<PowerRecord>('Power', options);

export const readStepsCadence = (options?: ReadRecordsOptions) =>
  readRecords<StepsCadenceRecord>('StepsCadence', options);

export const readCyclingPedalingCadence = (options?: ReadRecordsOptions) =>
  readRecords<CyclingPedalingCadenceRecord>('CyclingPedalingCadence', options);

export const readWheelchairPushes = (options?: ReadRecordsOptions) =>
  readRecords<WheelchairPushesRecord>('WheelchairPushes', options);

export const readMenstruationFlow = (options?: ReadRecordsOptions) =>
  readRecords<MenstruationFlowRecord>('MenstruationFlow', options);

export const readMenstruationPeriods = (options?: ReadRecordsOptions) =>
  readRecords<MenstruationPeriodRecord>('MenstruationPeriod', options);

export const readOvulationTests = (options?: ReadRecordsOptions) =>
  readRecords<OvulationTestRecord>('OvulationTest', options);

export const readCervicalMucus = (options?: ReadRecordsOptions) =>
  readRecords<CervicalMucusRecord>('CervicalMucus', options);

export const readIntermenstrualBleeding = (options?: ReadRecordsOptions) =>
  readRecords<IntermenstrualBleedingRecord>('IntermenstrualBleeding', options);

export const readSexualActivity = (options?: ReadRecordsOptions) =>
  readRecords<SexualActivityRecord>('SexualActivity', options);

export const readBasalBodyTemperature = (options?: ReadRecordsOptions) =>
  readRecords<BasalBodyTemperatureRecord>('BasalBodyTemperature', options);

export const readLeanBodyMass = (options?: ReadRecordsOptions) =>
  readRecords<LeanBodyMassRecord>('LeanBodyMass', options);

export const readBoneMass = (options?: ReadRecordsOptions) =>
  readRecords<BoneMassRecord>('BoneMass', options);

export const readBodyWaterMass = (options?: ReadRecordsOptions) =>
  readRecords<BodyWaterMassRecord>('BodyWaterMass', options);

export const readBasalMetabolicRate = (options?: ReadRecordsOptions) =>
  readRecords<BasalMetabolicRateRecord>('BasalMetabolicRate', options);

export const readHeartRateVariabilityRmssd = (options?: ReadRecordsOptions) =>
  readRecords<HeartRateVariabilityRmssdRecord>(
    'HeartRateVariabilityRmssd',
    options
  );

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
