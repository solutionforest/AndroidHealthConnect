import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  /** Returns 'available' | 'notInstalled' | 'notSupported' */
  isHealthConnectAvailable(): Promise<string>;

  /**
   * Returns JSON HealthConnectAvailabilityInfo (status, sdkStatus, provider,
   * GMS / Play Store flags, advice).
   */
  getHealthConnectAvailability(): Promise<string>;

  /** Launches the Health Connect permission dialog. Returns array of granted permissions. */
  requestPermissions(
    permissions: ReadonlyArray<string>
  ): Promise<ReadonlyArray<string>>;

  /** Returns subset of requested permissions that are currently granted. */
  checkPermissions(
    permissions: ReadonlyArray<string>
  ): Promise<ReadonlyArray<string>>;

  /** Revokes all Health Connect permissions granted to this app. */
  revokeAllPermissions(): Promise<boolean>;

  /** Opens Health Connect settings screen. */
  openHealthConnectSettings(): void;

  /** Opens the data-management / permission screen for the given package (or this app if empty). */
  openHealthConnectDataManagement(packageName: string): void;

  /** Opens Health Connect app, or the Play Store listing if not installed. */
  openHealthConnectApp(): void;

  /**
   * Reads records of the given type.
   * @param recordType - e.g. "Steps"
   * @param options    - JSON-serialised ReadRecordsOptions
   * @returns JSON-serialised ReadRecordsResponse
   */
  readRecords(recordType: string, options: string): Promise<string>;

  /**
   * Inserts an array of records.
   * @param records - JSON-serialised HealthRecord[]
   * @returns JSON-serialised InsertRecordsResponse
   */
  writeRecords(records: string): Promise<string>;

  /**
   * Updates existing records. Each record must include metadata.id from a prior read.
   * @returns true on success
   */
  updateRecords(records: string): Promise<boolean>;

  /** Deletes all records of a type within a time range. */
  deleteRecordsByTime(
    recordType: string,
    startTime: string,
    endTime: string
  ): Promise<boolean>;

  /** Deletes specific records by their Health Connect IDs. */
  deleteRecordsById(
    recordType: string,
    recordIds: ReadonlyArray<string>
  ): Promise<boolean>;

  /** JSON AggregateRequest → AggregateResult. */
  aggregateRecord(options: string): Promise<string>;

  /** JSON AggregateGroupByDurationRequest → AggregationResultGroupedByDuration[]. */
  aggregateGroupByDuration(options: string): Promise<string>;

  /** JSON AggregateGroupByPeriodRequest → AggregationResultGroupedByPeriod[]. */
  aggregateGroupByPeriod(options: string): Promise<string>;

  /**
   * Requests user consent to read an exercise route for a session.
   * @param recordId - ExerciseSession metadata.id
   * @returns JSON ExerciseRouteRead, or empty string when denied / no route
   */
  requestExerciseRoute(recordId: string): Promise<string>;

  /** JSON GetChangesTokenRequest → changes token string. */
  getChangesToken(options: string): Promise<string>;

  /** changesToken → JSON GetChangesResponse. */
  getChanges(changesToken: string): Promise<string>;

  /**
   * Checks whether a Health Connect feature is available on this device.
   * @param feature - feature name (e.g. "skinTemperature", "matchmaking")
   * @returns "available" | "unavailable"
   */
  getFeatureStatus(feature: string): Promise<string>;

  /**
   * Checks whether the Matchmaking UI can show relevant apps/devices.
   * @param options - JSON-serialised MatchmakingRequest
   */
  checkIfMatchmakingIsPossible(options: string): Promise<string>;

  /**
   * Launches the Health Connect Matchmaking flow.
   * Resolves true when the user finishes with RESULT_OK (at least one permission granted).
   * @param options - JSON-serialised MatchmakingRequest
   */
  launchMatchmaking(options: string): Promise<boolean>;

  /** Creates a MedicalDataSource. @param request JSON CreateMedicalDataSourceRequest */
  createMedicalDataSource(request: string): Promise<string>;

  /** Deletes a MedicalDataSource and all of its MedicalResources. */
  deleteMedicalDataSourceWithData(id: string): Promise<boolean>;

  /** Lists MedicalDataSources. @param request JSON GetMedicalDataSourcesRequest */
  getMedicalDataSources(request: string): Promise<string>;

  /** Upserts MedicalResources. @param requests JSON UpsertMedicalResourceRequest[] */
  upsertMedicalResources(requests: string): Promise<string>;

  /** Reads MedicalResources. @param request JSON ReadMedicalResourcesRequest */
  readMedicalResources(request: string): Promise<string>;

  /** Deletes MedicalResources by id or by type/data-source filter. */
  deleteMedicalResources(request: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AndroidHealthConnect');
