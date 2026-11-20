// ─── Availability ────────────────────────────────────────────────────────────

/** Result of checking whether Health Connect is usable on the current device. */
export type HealthConnectAvailability =
  | 'available' // HC is installed and ready (sdkStatus = 3 SDK_AVAILABLE)
  | 'notInstalled' // HC app needs to be installed / updated (sdkStatus = 2)
  | 'notSupported'; // OS too old, no GMS, or otherwise unusable (sdkStatus = 1)

/**
 * How Health Connect is delivered on this device.
 * - `framework` — Android 14+ system Health Connect
 * - `apk` — Play Store APK (Android 9–13)
 * - `none` — below API 28 / no provider path
 */
export type HealthConnectProviderKind = 'framework' | 'apk' | 'none';

/**
 * Detailed availability for UX (China / HMS / install vs built-in).
 * Raw `sdkStatus`: 1 = SDK_UNAVAILABLE, 2 = PROVIDER_UPDATE_REQUIRED, 3 = SDK_AVAILABLE.
 * Note: `3` is available — not “version too old”.
 */
export type HealthConnectAvailabilityInfo = {
  status: HealthConnectAvailability;
  sdkStatus: number;
  sdkStatusName: string;
  provider: HealthConnectProviderKind;
  androidSdkInt: number;
  googlePlayServicesAvailable: boolean;
  playStoreAvailable: boolean;
  advice: string;
};

// ─── Permissions ─────────────────────────────────────────────────────────────

export type HealthPermission =
  | 'android.permission.health.READ_STEPS'
  | 'android.permission.health.WRITE_STEPS'
  | 'android.permission.health.READ_HEART_RATE'
  | 'android.permission.health.WRITE_HEART_RATE'
  | 'android.permission.health.READ_SLEEP'
  | 'android.permission.health.WRITE_SLEEP'
  | 'android.permission.health.READ_ACTIVE_CALORIES_BURNED'
  | 'android.permission.health.WRITE_ACTIVE_CALORIES_BURNED'
  | 'android.permission.health.READ_TOTAL_CALORIES_BURNED'
  | 'android.permission.health.WRITE_TOTAL_CALORIES_BURNED'
  | 'android.permission.health.READ_DISTANCE'
  | 'android.permission.health.WRITE_DISTANCE'
  | 'android.permission.health.READ_WEIGHT'
  | 'android.permission.health.WRITE_WEIGHT'
  | 'android.permission.health.READ_HEIGHT'
  | 'android.permission.health.WRITE_HEIGHT'
  | 'android.permission.health.READ_BLOOD_PRESSURE'
  | 'android.permission.health.WRITE_BLOOD_PRESSURE'
  | 'android.permission.health.READ_BLOOD_GLUCOSE'
  | 'android.permission.health.WRITE_BLOOD_GLUCOSE'
  | 'android.permission.health.READ_OXYGEN_SATURATION'
  | 'android.permission.health.WRITE_OXYGEN_SATURATION'
  | 'android.permission.health.READ_BODY_TEMPERATURE'
  | 'android.permission.health.WRITE_BODY_TEMPERATURE'
  | 'android.permission.health.READ_BODY_FAT'
  | 'android.permission.health.WRITE_BODY_FAT'
  | 'android.permission.health.READ_HYDRATION'
  | 'android.permission.health.WRITE_HYDRATION'
  | 'android.permission.health.READ_EXERCISE'
  | 'android.permission.health.WRITE_EXERCISE'
  /** Plural — required to read routes on sessions you did not write. */
  | 'android.permission.health.READ_EXERCISE_ROUTES'
  /** Singular — required to insert/update a session with `exerciseRoute`. */
  | 'android.permission.health.WRITE_EXERCISE_ROUTE'
  | 'android.permission.health.READ_RESTING_HEART_RATE'
  | 'android.permission.health.WRITE_RESTING_HEART_RATE'
  | 'android.permission.health.READ_RESPIRATORY_RATE'
  | 'android.permission.health.WRITE_RESPIRATORY_RATE'
  | 'android.permission.health.READ_FLOORS_CLIMBED'
  | 'android.permission.health.WRITE_FLOORS_CLIMBED'
  | 'android.permission.health.READ_ELEVATION_GAINED'
  | 'android.permission.health.WRITE_ELEVATION_GAINED'
  | 'android.permission.health.READ_MINDFULNESS'
  | 'android.permission.health.WRITE_MINDFULNESS'
  | 'android.permission.health.READ_SKIN_TEMPERATURE'
  | 'android.permission.health.WRITE_SKIN_TEMPERATURE'
  | 'android.permission.health.READ_ACTIVITY_INTENSITY'
  | 'android.permission.health.WRITE_ACTIVITY_INTENSITY'
  /**
   * Read data older than ~30 days before first grant.
   * Check `getFeatureStatus('readHealthDataHistory')` first.
   */
  | 'android.permission.health.READ_HEALTH_DATA_HISTORY'
  /**
   * Read while the app is in the background.
   * Check `getFeatureStatus('readHealthDataInBackground')` first.
   */
  | 'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND'
  | 'android.permission.health.WRITE_MEDICAL_DATA'
  | 'android.permission.health.READ_MEDICAL_DATA_ALLERGIES_INTOLERANCES'
  | 'android.permission.health.READ_MEDICAL_DATA_CONDITIONS'
  | 'android.permission.health.READ_MEDICAL_DATA_LABORATORY_RESULTS'
  | 'android.permission.health.READ_MEDICAL_DATA_MEDICATIONS'
  | 'android.permission.health.READ_MEDICAL_DATA_PERSONAL_DETAILS'
  | 'android.permission.health.READ_MEDICAL_DATA_PRACTITIONER_DETAILS'
  | 'android.permission.health.READ_MEDICAL_DATA_PREGNANCY'
  | 'android.permission.health.READ_MEDICAL_DATA_PROCEDURES'
  | 'android.permission.health.READ_MEDICAL_DATA_SOCIAL_HISTORY'
  | 'android.permission.health.READ_MEDICAL_DATA_VACCINES'
  | 'android.permission.health.READ_MEDICAL_DATA_VISITS'
  | 'android.permission.health.READ_MEDICAL_DATA_VITAL_SIGNS'
  | (string & {}); // allow custom / future permissions

// ─── Common ───────────────────────────────────────────────────────────────────

export type DeviceInfo = {
  /** Device.TYPE_* constant (0 = unknown, 1 = watch, 2 = phone, …). */
  type: number;
  manufacturer?: string | null;
  model?: string | null;
};

export type RecordMetadata = {
  /** Unique identifier assigned by Health Connect. Empty string for new records. */
  id: string;
  /** Optional caller-provided identifier; enables idempotent inserts. */
  clientRecordId?: string | null;
  clientRecordVersion?: number;
  lastModifiedTime?: string; // ISO 8601
  dataOrigin?: string; // package name of the writing app
  /**
   * How the record was recorded. Compare against `RecordingMethod` constants.
   * Use `RecordingMethod.MANUAL_ENTRY` to detect user-typed data regardless
   * of which app (Health Connect, Google Fit, Samsung Health, etc.) wrote it.
   */
  recordingMethod?: number;
  /** Present on read when the writer set a device; optional on write. */
  device?: DeviceInfo | null;
};

export type TimeRangeFilter = {
  /** ISO 8601 start time (inclusive). */
  startTime: string;
  /** ISO 8601 end time (exclusive). */
  endTime: string;
};

export type ReadRecordsOptions = {
  timeRangeFilter?: TimeRangeFilter;
  /** Filter by package names that wrote the records. */
  dataOriginFilter?: string[];
  /** Default: true (oldest first). */
  ascendingOrder?: boolean;
  /** Maximum number of records per page. Default: 1000. */
  pageSize?: number;
  /** Opaque token returned from a previous read; used for pagination. */
  pageToken?: string;
};

export type ReadRecordsResponse<T> = {
  records: T[];
  /** Present when more pages are available. */
  pageToken?: string | null;
};

/** Record types that support Health Connect aggregation in this library. */
export type AggregateRecordType =
  | 'Steps'
  | 'Distance'
  | 'ActiveCaloriesBurned'
  | 'TotalCaloriesBurned'
  | 'HeartRate'
  | 'RestingHeartRate'
  | 'Weight'
  | 'Height'
  | 'Hydration'
  | 'FloorsClimbed'
  | 'ElevationGained'
  | 'ExerciseSession'
  | 'SleepSession'
  | 'BloodPressure'
  | 'MindfulnessSession'
  | 'ActivityIntensity';

export type EnergyResult = {
  inKilocalories: number;
  inCalories: number;
  inJoules: number;
};

export type LengthResult = {
  inMeters: number;
  inKilometers: number;
  inMiles: number;
};

export type MassResult = {
  inKilograms: number;
  inGrams: number;
  inPounds: number;
};

export type VolumeResult = {
  inLiters: number;
  inMilliliters: number;
};

export type PressureResult = {
  inMillimetersOfMercury: number;
};

export type DurationResult = {
  inSeconds: number;
};

export type AggregateRequest = {
  recordType: AggregateRecordType;
  timeRangeFilter: TimeRangeFilter;
  dataOriginFilter?: string[];
};

export type DurationRangeSlicer = {
  unit: 'millis' | 'seconds' | 'minutes' | 'hours' | 'days';
  value: number;
};

export type PeriodRangeSlicer = {
  unit: 'days' | 'weeks' | 'months' | 'years';
  value: number;
};

export type AggregateGroupByDurationRequest = AggregateRequest & {
  timeRangeSlicer: DurationRangeSlicer;
};

export type AggregateGroupByPeriodRequest = AggregateRequest & {
  timeRangeSlicer: PeriodRangeSlicer;
};

/**
 * Aggregated metrics for a record type. Metric keys match Health Connect
 * (e.g. `COUNT_TOTAL`, `BPM_AVG`). Missing data is `null`.
 */
export type AggregateMetricValue =
  | number
  | EnergyResult
  | LengthResult
  | MassResult
  | VolumeResult
  | PressureResult
  | DurationResult
  | null;

export type AggregateResult = {
  recordType: AggregateRecordType;
  dataOrigins: string[];
  metrics: Record<string, AggregateMetricValue>;
};

export type AggregationResultGroupedByDuration = {
  startTime: string;
  endTime: string;
  zoneOffset: string | null;
  result: AggregateResult;
};

export type AggregationResultGroupedByPeriod = {
  startTime: string;
  endTime: string;
  result: AggregateResult;
};

export type InsertRecordsResponse = {
  recordIdsList: string[];
};

// ─── Record types ─────────────────────────────────────────────────────────────

export type StepsRecord = {
  recordType: 'Steps';
  /** Number of steps. */
  count: number;
  startTime: string; // ISO 8601
  endTime: string;
  startZoneOffset?: string; // e.g. "+05:30"
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type HeartRateSample = {
  time: string; // ISO 8601
  beatsPerMinute: number;
};

export type HeartRateRecord = {
  recordType: 'HeartRate';
  samples: HeartRateSample[];
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type SleepStage = {
  startTime: string;
  endTime: string;
  /** See SleepStageType constants (0–7). */
  stage: number;
};

export type SleepSessionRecord = {
  recordType: 'SleepSession';
  startTime: string;
  endTime: string;
  title?: string | null;
  notes?: string | null;
  stages?: SleepStage[];
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type ActiveCaloriesBurnedRecord = {
  recordType: 'ActiveCaloriesBurned';
  /** Energy in kilocalories. */
  energy: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type TotalCaloriesBurnedRecord = {
  recordType: 'TotalCaloriesBurned';
  /** Energy in kilocalories. */
  energy: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type DistanceRecord = {
  recordType: 'Distance';
  /** Distance in meters. */
  distance: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type WeightRecord = {
  recordType: 'Weight';
  /** Weight in kilograms. */
  weight: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type HeightRecord = {
  recordType: 'Height';
  /** Height in meters. */
  height: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BloodPressureRecord = {
  recordType: 'BloodPressure';
  /** Systolic pressure in mmHg. */
  systolic: number;
  /** Diastolic pressure in mmHg. */
  diastolic: number;
  /** BloodPressureRecord.BODY_POSITION_* constant (0 = unknown). */
  bodyPosition?: number;
  /** BloodPressureRecord.MEASUREMENT_LOCATION_* constant (0 = unknown). */
  measurementLocation?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BloodGlucoseRecord = {
  recordType: 'BloodGlucose';
  /** Blood glucose level in mmol/L. */
  level: number;
  /** BloodGlucoseRecord.SPECIMEN_SOURCE_* (0 = unknown). */
  specimenSource?: number;
  /** MealType.MEAL_TYPE_* (0 = unknown). */
  mealType?: number;
  /** BloodGlucoseRecord.RELATION_TO_MEAL_* (0 = unknown). */
  relationToMeal?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type OxygenSaturationRecord = {
  recordType: 'OxygenSaturation';
  /** Percentage value between 0 and 100. */
  percentage: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BodyTemperatureRecord = {
  recordType: 'BodyTemperature';
  /** Temperature in Celsius. */
  temperature: number;
  /** BodyTemperatureRecord.MEASUREMENT_LOCATION_* (0 = unknown). */
  measurementLocation?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BodyFatRecord = {
  recordType: 'BodyFat';
  /** Body fat percentage between 0 and 100. */
  percentage: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type HydrationRecord = {
  recordType: 'Hydration';
  /** Volume of water consumed in liters. */
  volume: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type ExerciseSegment = {
  startTime: string;
  endTime: string;
  /** ExerciseSegmentType constant. */
  segmentType: number;
  repetitions?: number;
};

export type ExerciseLap = {
  startTime: string;
  endTime: string;
  /** Lap length in meters. */
  length?: number;
};

/**
 * Write-side route point. Optional accuracy/altitude are meters.
 * Omit optional fields instead of sending empty objects.
 */
export type ExerciseRouteLocation = {
  time: string;
  latitude: number;
  longitude: number;
  /** Meters above WGS84 ellipsoid. */
  altitude?: number;
  horizontalAccuracy?: number;
  verticalAccuracy?: number;
};

/** Read-side length fields use multi-unit result objects. */
export type ExerciseRouteLocationResult = {
  time: string;
  latitude: number;
  longitude: number;
  altitude?: LengthResult | null;
  horizontalAccuracy?: LengthResult | null;
  verticalAccuracy?: LengthResult | null;
};

export type ExerciseRouteWrite = {
  route: ExerciseRouteLocation[];
};

export type ExerciseRouteRead = {
  type: 'DATA' | 'NO_DATA' | 'CONSENT_REQUIRED';
  route: ExerciseRouteLocationResult[];
};

export type ExerciseSessionRecord = {
  recordType: 'ExerciseSession';
  /** ExerciseSessionRecord.EXERCISE_TYPE_* constant. */
  exerciseType: number;
  startTime: string;
  endTime: string;
  title?: string | null;
  notes?: string | null;
  segments?: ExerciseSegment[];
  laps?: ExerciseLap[];
  /** Write: pass `{ route: [...] }`. Read: `{ type, route }` with LengthResult fields. */
  exerciseRoute?: ExerciseRouteWrite | ExerciseRouteRead;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type RestingHeartRateRecord = {
  recordType: 'RestingHeartRate';
  beatsPerMinute: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type RespiratoryRateRecord = {
  recordType: 'RespiratoryRate';
  /** Breaths per minute. */
  rate: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type FloorsClimbedRecord = {
  recordType: 'FloorsClimbed';
  floors: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type ElevationGainedRecord = {
  recordType: 'ElevationGained';
  /** Elevation gained in meters. */
  elevation: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

/** Requires FEATURE_MINDFULNESS_SESSION on the device. */
export type MindfulnessSessionRecord = {
  recordType: 'MindfulnessSession';
  /** MindfulnessSessionType constant (0–5). */
  mindfulnessSessionType: number;
  startTime: string;
  endTime: string;
  title?: string | null;
  notes?: string | null;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type SkinTemperatureDelta = {
  time: string; // ISO 8601
  /** Delta in Celsius degrees (−30 to 30). */
  delta: number;
};

/** Requires FEATURE_SKIN_TEMPERATURE on the device. */
export type SkinTemperatureRecord = {
  recordType: 'SkinTemperature';
  deltas: SkinTemperatureDelta[];
  /** Optional baseline in Celsius. */
  baseline?: number | null;
  /** SkinTemperatureMeasurementLocation (0–3). */
  measurementLocation?: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

/** Requires FEATURE_ACTIVITY_INTENSITY on the device. */
export type ActivityIntensityRecord = {
  recordType: 'ActivityIntensity';
  /** ActivityIntensityType: 0 = moderate, 1 = vigorous. */
  activityIntensityType: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

// ─── Union & discriminant helpers ─────────────────────────────────────────────

export type HealthRecord =
  | StepsRecord
  | HeartRateRecord
  | SleepSessionRecord
  | ActiveCaloriesBurnedRecord
  | TotalCaloriesBurnedRecord
  | DistanceRecord
  | WeightRecord
  | HeightRecord
  | BloodPressureRecord
  | BloodGlucoseRecord
  | OxygenSaturationRecord
  | BodyTemperatureRecord
  | BodyFatRecord
  | HydrationRecord
  | ExerciseSessionRecord
  | RestingHeartRateRecord
  | RespiratoryRateRecord
  | FloorsClimbedRecord
  | ElevationGainedRecord
  | MindfulnessSessionRecord
  | SkinTemperatureRecord
  | ActivityIntensityRecord;

export type RecordType = HealthRecord['recordType'];

// ─── Changelog / changes token ────────────────────────────────────────────────

export type GetChangesTokenRequest = {
  /** Prefer one type per token so a revoked permission cannot invalidate others. */
  recordTypes: RecordType[];
  /** Optional package-name filters (data origins). */
  dataOriginFilters?: string[];
};

export type UpsertionChange = {
  record: HealthRecord;
};

export type DeletionChange = {
  recordId: string;
};

export type GetChangesResponse = {
  upsertionChanges: UpsertionChange[];
  deletionChanges: DeletionChange[];
  /** Persist and pass to the next {@link getChanges} call. */
  nextChangesToken: string;
  /** Call {@link getChanges} again with `nextChangesToken` until false. */
  hasMore: boolean;
  /**
   * Token older than ~30 days. Re-sync with `readRecords` then call
   * {@link getChangesToken} for a fresh token.
   */
  changesTokenExpired: boolean;
};

// ─── SleepStageType constants ─────────────────────────────────────────────────

export const SleepStageType = {
  UNKNOWN: 0,
  AWAKE: 1,
  SLEEPING: 2,
  OUT_OF_BED: 3,
  LIGHT: 4,
  DEEP: 5,
  REM: 6,
  AWAKE_IN_BED: 7,
} as const;

// ─── ExerciseType constants (most common) ─────────────────────────────────────

export const ExerciseType = {
  OTHER_WORKOUT: 0,
  BACK_EXTENSION: 1,
  BADMINTON: 2,
  BARBELL_SHOULDER_PRESS: 3,
  BASEBALL: 4,
  BASKETBALL: 5,
  BENCH_PRESS: 6,
  BENCH_SIT_UP: 7,
  BIKING: 8,
  BIKING_STATIONARY: 9,
  BOOT_CAMP: 10,
  BOXING: 11,
  BURPEE: 12,
  CALISTHENICS: 13,
  CRICKET: 14,
  CRUNCH: 15,
  DANCING: 16,
  DEADLIFT: 17,
  ELLIPTICAL: 18,
  FOOTBALL_AMERICAN: 19,
  FOOTBALL_AUSTRALIAN: 20,
  FRISBEE_DISC: 21,
  GOLF: 22,
  GUIDED_BREATHING: 23,
  GYMNASTICS: 24,
  HANDBALL: 25,
  HIGH_INTENSITY_INTERVAL_TRAINING: 26,
  HIKING: 27,
  ICE_HOCKEY: 28,
  ICE_SKATING: 29,
  JUMP_ROPE: 30,
  JUMPING_JACK: 31,
  LAT_PULL_DOWN: 32,
  LUNGE: 33,
  MARTIAL_ARTS: 34,
  PADDLING: 35,
  PARAGLIDING: 36,
  PILATES: 37,
  PLANK: 38,
  RACQUETBALL: 39,
  ROCK_CLIMBING: 40,
  ROLLER_HOCKEY: 41,
  ROWING: 42,
  ROWING_MACHINE: 43,
  RUGBY: 44,
  RUNNING: 45,
  RUNNING_TREADMILL: 46,
  SAILING: 47,
  SCUBA_DIVING: 48,
  SKATING: 49,
  SKIING: 50,
  SNOWBOARDING: 51,
  SNOWSHOEING: 52,
  SOCCER: 53,
  SOFTBALL: 54,
  SQUASH: 55,
  SQUAT: 56,
  STAIR_CLIMBING: 57,
  STAIR_CLIMBING_MACHINE: 58,
  STRENGTH_TRAINING: 59,
  STRETCHING: 60,
  SURFING: 61,
  SWIMMING_OPEN_WATER: 62,
  SWIMMING_POOL: 63,
  TABLE_TENNIS: 64,
  TENNIS: 65,
  UPPER_TWIST: 66,
  VOLLEYBALL: 67,
  WALKING: 68,
  WATER_POLO: 69,
  WEIGHTLIFTING: 70,
  WHEEL_CHAIR: 71,
  YOGA: 72,
} as const;

// ─── RecordingMethod constants ────────────────────────────────────────────────

export const RecordingMethod = {
  UNKNOWN: 0,
  /** Data was actively recorded by a sensor or wearable device. */
  ACTIVELY_RECORDED: 1,
  /** Data was inferred or recorded automatically in the background. */
  AUTOMATICALLY_RECORDED: 2,
  /**
   * Data was manually entered by the user.
   * This is true regardless of which app was used (Health Connect, Google Fit,
   * Samsung Health, etc.).
   */
  MANUAL_ENTRY: 3,
} as const;

// ─── Feature availability (connect-client 1.1+ / 1.2 alpha) ───────────────────

/**
 * Feature names accepted by {@link getFeatureStatus}.
 * Maps to `HealthConnectFeatures.FEATURE_*` on Android.
 */
export type HealthConnectFeature =
  | 'activityIntensity'
  | 'matchmaking'
  | 'mindfulnessSession'
  | 'personalHealthRecord'
  | 'plannedExercise'
  | 'readHealthDataHistory'
  | 'readHealthDataInBackground'
  | 'skinTemperature'
  | 'extendedDeviceTypes'
  | 'exerciseSessionImprovements';

export type FeatureStatus = 'available' | 'unavailable';

export const MindfulnessSessionType = {
  UNKNOWN: 0,
  MEDITATION: 1,
  BREATHING: 2,
  MUSIC: 3,
  MOVEMENT: 4,
  UNGUIDED: 5,
} as const;

export const SkinTemperatureMeasurementLocation = {
  UNKNOWN: 0,
  FINGER: 1,
  TOE: 2,
  WRIST: 3,
} as const;

export const ActivityIntensityType = {
  MODERATE: 0,
  VIGOROUS: 1,
} as const;

// ─── Matchmaking (experimental) ───────────────────────────────────────────────

export type MatchmakingRequest = {
  /**
   * Record type names the app can read (e.g. `'Steps'`).
   * Empty / omitted → all record types the app has read permission for.
   */
  recordTypes?: RecordType[];
  /** Package names to exclusively include as data sources. */
  includedDataSources?: string[];
  /** Package names to exclude as data sources. */
  excludedDataSources?: string[];
};

export type MatchmakingPossibleResponse = {
  isMatchmakingPossible: boolean;
};

// ─── Personal Health Record / medical (experimental) ──────────────────────────

export const MedicalResourceType = {
  VACCINES: 1,
  ALLERGIES_INTOLERANCES: 2,
  PREGNANCY: 3,
  SOCIAL_HISTORY: 4,
  VITAL_SIGNS: 5,
  LABORATORY_RESULTS: 6,
  CONDITIONS: 7,
  PROCEDURES: 8,
  MEDICATIONS: 9,
  PERSONAL_DETAILS: 10,
  PRACTITIONER_DETAILS: 11,
  VISITS: 12,
} as const;

export type FhirVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type MedicalDataSource = {
  id: string;
  displayName: string;
  fhirBaseUri: string;
  fhirVersion: FhirVersion;
  packageName?: string;
};

export type CreateMedicalDataSourceRequest = {
  displayName: string;
  /** e.g. `https://example.com/fhir/` or `myapp://source`. */
  fhirBaseUri: string;
  fhirVersion: FhirVersion;
};

export type UpsertMedicalResourceRequest = {
  dataSourceId: string;
  fhirVersion: FhirVersion;
  /** Valid FHIR resource JSON string. */
  data: string;
};

export type MedicalResourceId = {
  dataSourceId: string;
  /** `FhirResource` type constant (int). */
  fhirResourceType: number;
  fhirResourceId: string;
};

export type FhirResource = {
  /** `FhirResource` type constant (int). */
  type: number;
  id: string;
  /** FHIR resource JSON string. */
  data: string;
};

export type MedicalResource = {
  type: number;
  id: MedicalResourceId;
  dataSourceId: string;
  fhirVersion: FhirVersion;
  fhirResource: FhirResource;
};

export type ReadMedicalResourcesRequest = {
  /**
   * Initial page: set `medicalResourceType`.
   * Subsequent pages: set `pageToken` from the previous response.
   */
  medicalResourceType?: number;
  medicalDataSourceIds?: string[];
  pageSize?: number;
  pageToken?: string | null;
};

export type ReadMedicalResourcesResponse = {
  medicalResources: MedicalResource[];
  nextPageToken?: string | null;
};

export type DeleteMedicalResourcesRequest = {
  /** Delete by IDs (takes precedence when non-empty). */
  ids?: MedicalResourceId[];
  dataSourceIds?: string[];
  medicalResourceTypes?: number[];
};

export type GetMedicalDataSourcesRequest = {
  /**
   * When set, fetch these data sources by ID
   * (`HealthConnectClient.getMedicalDataSources(ids)`).
   */
  medicalDataSourceIds?: string[];
  /**
   * When IDs are omitted, filter by writing-app package names
   * (`GetMedicalDataSourcesRequest`). Empty / omitted → all visible sources.
   */
  packageNames?: string[];
};
