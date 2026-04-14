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
} from './types';

export * from './types';

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
