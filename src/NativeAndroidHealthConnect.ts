import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  /** Returns 'available' | 'notInstalled' | 'notSupported' */
  isHealthConnectAvailable(): Promise<string>;

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
}

export default TurboModuleRegistry.getEnforcing<Spec>('AndroidHealthConnect');
