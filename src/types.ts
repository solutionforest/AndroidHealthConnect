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
  /** Requires `getFeatureStatus('plannedExercise') === 'available'`. */
  | 'android.permission.health.READ_PLANNED_EXERCISE'
  | 'android.permission.health.WRITE_PLANNED_EXERCISE'
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
  | 'android.permission.health.READ_NUTRITION'
  | 'android.permission.health.WRITE_NUTRITION'
  | 'android.permission.health.READ_VO2_MAX'
  | 'android.permission.health.WRITE_VO2_MAX'
  | 'android.permission.health.READ_SPEED'
  | 'android.permission.health.WRITE_SPEED'
  | 'android.permission.health.READ_POWER'
  | 'android.permission.health.WRITE_POWER'
  | 'android.permission.health.READ_WHEELCHAIR_PUSHES'
  | 'android.permission.health.WRITE_WHEELCHAIR_PUSHES'
  | 'android.permission.health.READ_MENSTRUATION'
  | 'android.permission.health.WRITE_MENSTRUATION'
  | 'android.permission.health.READ_OVULATION_TEST'
  | 'android.permission.health.WRITE_OVULATION_TEST'
  | 'android.permission.health.READ_CERVICAL_MUCUS'
  | 'android.permission.health.WRITE_CERVICAL_MUCUS'
  | 'android.permission.health.READ_INTERMENSTRUAL_BLEEDING'
  | 'android.permission.health.WRITE_INTERMENSTRUAL_BLEEDING'
  | 'android.permission.health.READ_SEXUAL_ACTIVITY'
  | 'android.permission.health.WRITE_SEXUAL_ACTIVITY'
  | 'android.permission.health.READ_BASAL_BODY_TEMPERATURE'
  | 'android.permission.health.WRITE_BASAL_BODY_TEMPERATURE'
  | 'android.permission.health.READ_LEAN_BODY_MASS'
  | 'android.permission.health.WRITE_LEAN_BODY_MASS'
  | 'android.permission.health.READ_BONE_MASS'
  | 'android.permission.health.WRITE_BONE_MASS'
  | 'android.permission.health.READ_BODY_WATER_MASS'
  | 'android.permission.health.WRITE_BODY_WATER_MASS'
  | 'android.permission.health.READ_BASAL_METABOLIC_RATE'
  | 'android.permission.health.WRITE_BASAL_METABOLIC_RATE'
  | 'android.permission.health.READ_HEART_RATE_VARIABILITY'
  | 'android.permission.health.WRITE_HEART_RATE_VARIABILITY'
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

/**
 * Typed Health Connect permission strings for autocomplete.
 * Prefer these over hand-typed `android.permission.health.*` literals.
 */
export const Permission = {
  READ_STEPS: 'android.permission.health.READ_STEPS',
  WRITE_STEPS: 'android.permission.health.WRITE_STEPS',
  READ_HEART_RATE: 'android.permission.health.READ_HEART_RATE',
  WRITE_HEART_RATE: 'android.permission.health.WRITE_HEART_RATE',
  READ_SLEEP: 'android.permission.health.READ_SLEEP',
  WRITE_SLEEP: 'android.permission.health.WRITE_SLEEP',
  READ_ACTIVE_CALORIES_BURNED:
    'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  WRITE_ACTIVE_CALORIES_BURNED:
    'android.permission.health.WRITE_ACTIVE_CALORIES_BURNED',
  READ_TOTAL_CALORIES_BURNED:
    'android.permission.health.READ_TOTAL_CALORIES_BURNED',
  WRITE_TOTAL_CALORIES_BURNED:
    'android.permission.health.WRITE_TOTAL_CALORIES_BURNED',
  READ_DISTANCE: 'android.permission.health.READ_DISTANCE',
  WRITE_DISTANCE: 'android.permission.health.WRITE_DISTANCE',
  READ_WEIGHT: 'android.permission.health.READ_WEIGHT',
  WRITE_WEIGHT: 'android.permission.health.WRITE_WEIGHT',
  READ_HEIGHT: 'android.permission.health.READ_HEIGHT',
  WRITE_HEIGHT: 'android.permission.health.WRITE_HEIGHT',
  READ_BLOOD_PRESSURE: 'android.permission.health.READ_BLOOD_PRESSURE',
  WRITE_BLOOD_PRESSURE: 'android.permission.health.WRITE_BLOOD_PRESSURE',
  READ_BLOOD_GLUCOSE: 'android.permission.health.READ_BLOOD_GLUCOSE',
  WRITE_BLOOD_GLUCOSE: 'android.permission.health.WRITE_BLOOD_GLUCOSE',
  READ_OXYGEN_SATURATION: 'android.permission.health.READ_OXYGEN_SATURATION',
  WRITE_OXYGEN_SATURATION: 'android.permission.health.WRITE_OXYGEN_SATURATION',
  READ_BODY_TEMPERATURE: 'android.permission.health.READ_BODY_TEMPERATURE',
  WRITE_BODY_TEMPERATURE: 'android.permission.health.WRITE_BODY_TEMPERATURE',
  READ_BODY_FAT: 'android.permission.health.READ_BODY_FAT',
  WRITE_BODY_FAT: 'android.permission.health.WRITE_BODY_FAT',
  READ_HYDRATION: 'android.permission.health.READ_HYDRATION',
  WRITE_HYDRATION: 'android.permission.health.WRITE_HYDRATION',
  READ_EXERCISE: 'android.permission.health.READ_EXERCISE',
  WRITE_EXERCISE: 'android.permission.health.WRITE_EXERCISE',
  READ_EXERCISE_ROUTES: 'android.permission.health.READ_EXERCISE_ROUTES',
  WRITE_EXERCISE_ROUTE: 'android.permission.health.WRITE_EXERCISE_ROUTE',
  READ_PLANNED_EXERCISE: 'android.permission.health.READ_PLANNED_EXERCISE',
  WRITE_PLANNED_EXERCISE: 'android.permission.health.WRITE_PLANNED_EXERCISE',
  READ_RESTING_HEART_RATE: 'android.permission.health.READ_RESTING_HEART_RATE',
  WRITE_RESTING_HEART_RATE:
    'android.permission.health.WRITE_RESTING_HEART_RATE',
  READ_RESPIRATORY_RATE: 'android.permission.health.READ_RESPIRATORY_RATE',
  WRITE_RESPIRATORY_RATE: 'android.permission.health.WRITE_RESPIRATORY_RATE',
  READ_FLOORS_CLIMBED: 'android.permission.health.READ_FLOORS_CLIMBED',
  WRITE_FLOORS_CLIMBED: 'android.permission.health.WRITE_FLOORS_CLIMBED',
  READ_ELEVATION_GAINED: 'android.permission.health.READ_ELEVATION_GAINED',
  WRITE_ELEVATION_GAINED: 'android.permission.health.WRITE_ELEVATION_GAINED',
  READ_MINDFULNESS: 'android.permission.health.READ_MINDFULNESS',
  WRITE_MINDFULNESS: 'android.permission.health.WRITE_MINDFULNESS',
  READ_SKIN_TEMPERATURE: 'android.permission.health.READ_SKIN_TEMPERATURE',
  WRITE_SKIN_TEMPERATURE: 'android.permission.health.WRITE_SKIN_TEMPERATURE',
  READ_ACTIVITY_INTENSITY: 'android.permission.health.READ_ACTIVITY_INTENSITY',
  WRITE_ACTIVITY_INTENSITY:
    'android.permission.health.WRITE_ACTIVITY_INTENSITY',
  READ_NUTRITION: 'android.permission.health.READ_NUTRITION',
  WRITE_NUTRITION: 'android.permission.health.WRITE_NUTRITION',
  READ_VO2_MAX: 'android.permission.health.READ_VO2_MAX',
  WRITE_VO2_MAX: 'android.permission.health.WRITE_VO2_MAX',
  READ_SPEED: 'android.permission.health.READ_SPEED',
  WRITE_SPEED: 'android.permission.health.WRITE_SPEED',
  READ_POWER: 'android.permission.health.READ_POWER',
  WRITE_POWER: 'android.permission.health.WRITE_POWER',
  READ_WHEELCHAIR_PUSHES: 'android.permission.health.READ_WHEELCHAIR_PUSHES',
  WRITE_WHEELCHAIR_PUSHES: 'android.permission.health.WRITE_WHEELCHAIR_PUSHES',
  READ_MENSTRUATION: 'android.permission.health.READ_MENSTRUATION',
  WRITE_MENSTRUATION: 'android.permission.health.WRITE_MENSTRUATION',
  READ_OVULATION_TEST: 'android.permission.health.READ_OVULATION_TEST',
  WRITE_OVULATION_TEST: 'android.permission.health.WRITE_OVULATION_TEST',
  READ_CERVICAL_MUCUS: 'android.permission.health.READ_CERVICAL_MUCUS',
  WRITE_CERVICAL_MUCUS: 'android.permission.health.WRITE_CERVICAL_MUCUS',
  READ_INTERMENSTRUAL_BLEEDING:
    'android.permission.health.READ_INTERMENSTRUAL_BLEEDING',
  WRITE_INTERMENSTRUAL_BLEEDING:
    'android.permission.health.WRITE_INTERMENSTRUAL_BLEEDING',
  READ_SEXUAL_ACTIVITY: 'android.permission.health.READ_SEXUAL_ACTIVITY',
  WRITE_SEXUAL_ACTIVITY: 'android.permission.health.WRITE_SEXUAL_ACTIVITY',
  READ_BASAL_BODY_TEMPERATURE:
    'android.permission.health.READ_BASAL_BODY_TEMPERATURE',
  WRITE_BASAL_BODY_TEMPERATURE:
    'android.permission.health.WRITE_BASAL_BODY_TEMPERATURE',
  READ_LEAN_BODY_MASS: 'android.permission.health.READ_LEAN_BODY_MASS',
  WRITE_LEAN_BODY_MASS: 'android.permission.health.WRITE_LEAN_BODY_MASS',
  READ_BONE_MASS: 'android.permission.health.READ_BONE_MASS',
  WRITE_BONE_MASS: 'android.permission.health.WRITE_BONE_MASS',
  READ_BODY_WATER_MASS: 'android.permission.health.READ_BODY_WATER_MASS',
  WRITE_BODY_WATER_MASS: 'android.permission.health.WRITE_BODY_WATER_MASS',
  READ_BASAL_METABOLIC_RATE:
    'android.permission.health.READ_BASAL_METABOLIC_RATE',
  WRITE_BASAL_METABOLIC_RATE:
    'android.permission.health.WRITE_BASAL_METABOLIC_RATE',
  READ_HEART_RATE_VARIABILITY:
    'android.permission.health.READ_HEART_RATE_VARIABILITY',
  WRITE_HEART_RATE_VARIABILITY:
    'android.permission.health.WRITE_HEART_RATE_VARIABILITY',
  READ_HEALTH_DATA_HISTORY:
    'android.permission.health.READ_HEALTH_DATA_HISTORY',
  READ_HEALTH_DATA_IN_BACKGROUND:
    'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND',
  WRITE_MEDICAL_DATA: 'android.permission.health.WRITE_MEDICAL_DATA',
  READ_MEDICAL_DATA_ALLERGIES_INTOLERANCES:
    'android.permission.health.READ_MEDICAL_DATA_ALLERGIES_INTOLERANCES',
  READ_MEDICAL_DATA_CONDITIONS:
    'android.permission.health.READ_MEDICAL_DATA_CONDITIONS',
  READ_MEDICAL_DATA_LABORATORY_RESULTS:
    'android.permission.health.READ_MEDICAL_DATA_LABORATORY_RESULTS',
  READ_MEDICAL_DATA_MEDICATIONS:
    'android.permission.health.READ_MEDICAL_DATA_MEDICATIONS',
  READ_MEDICAL_DATA_PERSONAL_DETAILS:
    'android.permission.health.READ_MEDICAL_DATA_PERSONAL_DETAILS',
  READ_MEDICAL_DATA_PRACTITIONER_DETAILS:
    'android.permission.health.READ_MEDICAL_DATA_PRACTITIONER_DETAILS',
  READ_MEDICAL_DATA_PREGNANCY:
    'android.permission.health.READ_MEDICAL_DATA_PREGNANCY',
  READ_MEDICAL_DATA_PROCEDURES:
    'android.permission.health.READ_MEDICAL_DATA_PROCEDURES',
  READ_MEDICAL_DATA_SOCIAL_HISTORY:
    'android.permission.health.READ_MEDICAL_DATA_SOCIAL_HISTORY',
  READ_MEDICAL_DATA_VACCINES:
    'android.permission.health.READ_MEDICAL_DATA_VACCINES',
  READ_MEDICAL_DATA_VISITS:
    'android.permission.health.READ_MEDICAL_DATA_VISITS',
  READ_MEDICAL_DATA_VITAL_SIGNS:
    'android.permission.health.READ_MEDICAL_DATA_VITAL_SIGNS',
} as const satisfies Record<string, HealthPermission>;

export type PermissionKey = keyof typeof Permission;

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
  | 'ActivityIntensity'
  | 'Nutrition'
  | 'Speed'
  | 'Power'
  | 'StepsCadence'
  | 'CyclingPedalingCadence'
  | 'WheelchairPushes'
  | 'BasalMetabolicRate';

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

export type VelocityResult = {
  inMetersPerSecond: number;
  inKilometersPerHour: number;
  inMilesPerHour: number;
};

export type PowerResult = {
  inWatts: number;
  inKilocaloriesPerDay: number;
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
  | VelocityResult
  | PowerResult
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
  /** {@link ExerciseSegmentType} constant. */
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
  /** ExerciseSessionRecord.EXERCISE_TYPE_* constant — use {@link ExerciseType}. */
  exerciseType: number;
  startTime: string;
  endTime: string;
  title?: string | null;
  notes?: string | null;
  segments?: ExerciseSegment[];
  laps?: ExerciseLap[];
  /** Write: pass `{ route: [...] }`. Read: `{ type, route }` with LengthResult fields. */
  exerciseRoute?: ExerciseRouteWrite | ExerciseRouteRead;
  /**
   * Link to a planned exercise session id.
   * Requires `getFeatureStatus('exerciseSessionImprovements') === 'available'`.
   */
  plannedExerciseSessionId?: string | null;
  /**
   * Rate of perceived exertion (typically 0–10).
   * Requires `getFeatureStatus('exerciseSessionImprovements') === 'available'`.
   */
  rateOfPerceivedExertion?: number | null;
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

/**
 * Nutrient masses are grams; `energy` and `energyFromFat` are kilocalories.
 */
export type NutritionRecord = {
  recordType: 'Nutrition';
  biotin?: number | null;
  caffeine?: number | null;
  calcium?: number | null;
  energy?: number | null;
  energyFromFat?: number | null;
  chloride?: number | null;
  cholesterol?: number | null;
  chromium?: number | null;
  copper?: number | null;
  dietaryFiber?: number | null;
  folate?: number | null;
  folicAcid?: number | null;
  iodine?: number | null;
  iron?: number | null;
  magnesium?: number | null;
  manganese?: number | null;
  molybdenum?: number | null;
  monounsaturatedFat?: number | null;
  niacin?: number | null;
  pantothenicAcid?: number | null;
  phosphorus?: number | null;
  polyunsaturatedFat?: number | null;
  potassium?: number | null;
  protein?: number | null;
  riboflavin?: number | null;
  saturatedFat?: number | null;
  selenium?: number | null;
  sodium?: number | null;
  sugar?: number | null;
  thiamin?: number | null;
  totalCarbohydrate?: number | null;
  totalFat?: number | null;
  transFat?: number | null;
  unsaturatedFat?: number | null;
  vitaminA?: number | null;
  vitaminB12?: number | null;
  vitaminB6?: number | null;
  vitaminC?: number | null;
  vitaminD?: number | null;
  vitaminE?: number | null;
  vitaminK?: number | null;
  zinc?: number | null;
  name?: string | null;
  /** MealType.MEAL_TYPE_* constant. */
  mealType?: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type Vo2MaxRecord = {
  recordType: 'Vo2Max';
  vo2MillilitersPerMinuteKilogram: number;
  /** Vo2MaxRecord.MEASUREMENT_METHOD_* constant (0–5). */
  measurementMethod?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type SpeedSample = {
  time: string;
  metersPerSecond: number;
};

export type SpeedRecord = {
  recordType: 'Speed';
  samples: SpeedSample[];
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type PowerSample = {
  time: string;
  watts: number;
};

export type PowerRecord = {
  recordType: 'Power';
  samples: PowerSample[];
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type StepsCadenceSample = {
  time: string;
  /** Steps per minute. */
  rate: number;
};

export type StepsCadenceRecord = {
  recordType: 'StepsCadence';
  samples: StepsCadenceSample[];
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type CyclingPedalingCadenceSample = {
  time: string;
  revolutionsPerMinute: number;
};

export type CyclingPedalingCadenceRecord = {
  recordType: 'CyclingPedalingCadence';
  samples: CyclingPedalingCadenceSample[];
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type WheelchairPushesRecord = {
  recordType: 'WheelchairPushes';
  count: number;
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type MenstruationFlowRecord = {
  recordType: 'MenstruationFlow';
  /** MenstruationFlowRecord.FLOW_* constant (0–3). */
  flow?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type MenstruationPeriodRecord = {
  recordType: 'MenstruationPeriod';
  startTime: string;
  endTime: string;
  startZoneOffset?: string;
  endZoneOffset?: string;
  metadata?: RecordMetadata;
};

export type OvulationTestRecord = {
  recordType: 'OvulationTest';
  /** OvulationTestRecord.RESULT_* constant (0–3). */
  result: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type CervicalMucusRecord = {
  recordType: 'CervicalMucus';
  /** CervicalMucusRecord.APPEARANCE_* constant (0–6). */
  appearance?: number;
  /** CervicalMucusRecord.SENSATION_* constant (0–3). */
  sensation?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type IntermenstrualBleedingRecord = {
  recordType: 'IntermenstrualBleeding';
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type SexualActivityRecord = {
  recordType: 'SexualActivity';
  /** SexualActivityRecord.PROTECTION_USED_* constant (0–2). */
  protectionUsed?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BasalBodyTemperatureRecord = {
  recordType: 'BasalBodyTemperature';
  /** Celsius. */
  temperature: number;
  /** BodyTemperatureMeasurementLocation constant. */
  measurementLocation?: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type LeanBodyMassRecord = {
  recordType: 'LeanBodyMass';
  /** Kilograms. */
  mass: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BoneMassRecord = {
  recordType: 'BoneMass';
  /** Kilograms. */
  mass: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BodyWaterMassRecord = {
  recordType: 'BodyWaterMass';
  /** Kilograms. */
  mass: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type BasalMetabolicRateRecord = {
  recordType: 'BasalMetabolicRate';
  /** Kilocalories per day. */
  basalMetabolicRate: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

export type HeartRateVariabilityRmssdRecord = {
  recordType: 'HeartRateVariabilityRmssd';
  /** RMSSD in milliseconds. */
  heartRateVariabilityMillis: number;
  time: string;
  zoneOffset?: string;
  metadata?: RecordMetadata;
};

/** Requires `getFeatureStatus('plannedExercise') === 'available'`. */
export type ExerciseCompletionGoal =
  | { type: 'Distance'; distance: number }
  | { type: 'Duration'; durationMillis: number }
  | { type: 'Repetitions'; repetitions: number }
  | { type: 'Steps'; steps: number }
  | { type: 'ActiveCaloriesBurned'; energy: number }
  | { type: 'TotalCaloriesBurned'; energy: number }
  | { type: 'DistanceAndDuration'; distance: number; durationMillis: number }
  | { type: 'ManualCompletion' }
  | { type: 'Unknown' };

export type ExercisePerformanceTarget =
  | { type: 'HeartRate'; minHeartRate: number; maxHeartRate: number }
  | {
      type: 'Speed';
      minMetersPerSecond: number;
      maxMetersPerSecond: number;
    }
  | { type: 'Power'; minWatts: number; maxWatts: number }
  | { type: 'Cadence'; minRpm: number; maxRpm: number }
  | { type: 'Weight'; mass: number }
  | { type: 'RateOfPerceivedExertion'; rpe: number }
  | { type: 'Amrap' }
  | { type: 'Unknown' };

export type PlannedExerciseStep = {
  /** Prefer {@link ExerciseSegmentType} (segment ids, not session ExerciseType). */
  exerciseType: number;
  /** {@link ExercisePhase} constant. */
  exercisePhase: number;
  completionGoal: ExerciseCompletionGoal;
  performanceTargets?: ExercisePerformanceTarget[];
  description?: string | null;
};

export type PlannedExerciseBlock = {
  repetitions: number;
  steps: PlannedExerciseStep[];
  description?: string | null;
};

/** Requires FEATURE_PLANNED_EXERCISE on the device. */
export type PlannedExerciseSessionRecord = {
  recordType: 'PlannedExerciseSession';
  /** Session-level {@link ExerciseType}. */
  exerciseType: number;
  startTime: string;
  endTime: string;
  title?: string | null;
  notes?: string | null;
  blocks?: PlannedExerciseBlock[];
  /** Read-only link filled when a related ExerciseSession completes. */
  completedExerciseSessionId?: string | null;
  hasExplicitTime?: boolean;
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
  | ActivityIntensityRecord
  | NutritionRecord
  | Vo2MaxRecord
  | SpeedRecord
  | PowerRecord
  | StepsCadenceRecord
  | CyclingPedalingCadenceRecord
  | WheelchairPushesRecord
  | MenstruationFlowRecord
  | MenstruationPeriodRecord
  | OvulationTestRecord
  | CervicalMucusRecord
  | IntermenstrualBleedingRecord
  | SexualActivityRecord
  | BasalBodyTemperatureRecord
  | LeanBodyMassRecord
  | BoneMassRecord
  | BodyWaterMassRecord
  | BasalMetabolicRateRecord
  | HeartRateVariabilityRmssdRecord
  | PlannedExerciseSessionRecord;

export type RecordType = HealthRecord['recordType'];

/**
 * Typed Health Connect record-type strings for autocomplete.
 * Prefer these over hand-typed `'Steps'` / `'HeartRate'` literals in
 * `writeRecords`, `aggregateRecord`, `getChangesToken`, etc.
 *
 * @example
 * ```ts
 * await writeRecords([
 *   { recordType: RecordType.STEPS, count: 1500, startTime, endTime },
 * ]);
 * await aggregateRecord({
 *   recordType: RecordType.STEPS,
 *   timeRangeFilter: timeRangeToday(),
 * });
 * ```
 */
export const RecordType = {
  STEPS: 'Steps',
  HEART_RATE: 'HeartRate',
  SLEEP_SESSION: 'SleepSession',
  ACTIVE_CALORIES_BURNED: 'ActiveCaloriesBurned',
  TOTAL_CALORIES_BURNED: 'TotalCaloriesBurned',
  DISTANCE: 'Distance',
  WEIGHT: 'Weight',
  HEIGHT: 'Height',
  BLOOD_PRESSURE: 'BloodPressure',
  BLOOD_GLUCOSE: 'BloodGlucose',
  OXYGEN_SATURATION: 'OxygenSaturation',
  BODY_TEMPERATURE: 'BodyTemperature',
  BODY_FAT: 'BodyFat',
  HYDRATION: 'Hydration',
  EXERCISE_SESSION: 'ExerciseSession',
  PLANNED_EXERCISE_SESSION: 'PlannedExerciseSession',
  RESTING_HEART_RATE: 'RestingHeartRate',
  RESPIRATORY_RATE: 'RespiratoryRate',
  FLOORS_CLIMBED: 'FloorsClimbed',
  ELEVATION_GAINED: 'ElevationGained',
  MINDFULNESS_SESSION: 'MindfulnessSession',
  SKIN_TEMPERATURE: 'SkinTemperature',
  ACTIVITY_INTENSITY: 'ActivityIntensity',
  NUTRITION: 'Nutrition',
  VO2_MAX: 'Vo2Max',
  SPEED: 'Speed',
  POWER: 'Power',
  STEPS_CADENCE: 'StepsCadence',
  CYCLING_PEDALING_CADENCE: 'CyclingPedalingCadence',
  WHEELCHAIR_PUSHES: 'WheelchairPushes',
  MENSTRUATION_FLOW: 'MenstruationFlow',
  MENSTRUATION_PERIOD: 'MenstruationPeriod',
  OVULATION_TEST: 'OvulationTest',
  CERVICAL_MUCUS: 'CervicalMucus',
  INTERMENSTRUAL_BLEEDING: 'IntermenstrualBleeding',
  SEXUAL_ACTIVITY: 'SexualActivity',
  BASAL_BODY_TEMPERATURE: 'BasalBodyTemperature',
  LEAN_BODY_MASS: 'LeanBodyMass',
  BONE_MASS: 'BoneMass',
  BODY_WATER_MASS: 'BodyWaterMass',
  BASAL_METABOLIC_RATE: 'BasalMetabolicRate',
  HEART_RATE_VARIABILITY_RMSSD: 'HeartRateVariabilityRmssd',
} as const satisfies { readonly [key: string]: RecordType };

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

export type GetChangesOptions = {
  /** Soft page size hint (1–5000). Omit for platform default. */
  pageSize?: number;
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

/**
 * `ExerciseSessionRecord.EXERCISE_TYPE_*` — values match connect-client 1.2.
 * Gaps in numbering are intentional (removed / reserved platform ids).
 * Segment-level types belong in {@link ExerciseSegmentType}, not here.
 */
export const ExerciseType = {
  OTHER_WORKOUT: 0,
  BADMINTON: 2,
  BASEBALL: 4,
  BASKETBALL: 5,
  BIKING: 8,
  BIKING_STATIONARY: 9,
  BOOT_CAMP: 10,
  BOXING: 11,
  CALISTHENICS: 13,
  CRICKET: 14,
  DANCING: 16,
  ELLIPTICAL: 25,
  EXERCISE_CLASS: 26,
  FENCING: 27,
  FOOTBALL_AMERICAN: 28,
  FOOTBALL_AUSTRALIAN: 29,
  FRISBEE_DISC: 31,
  GOLF: 32,
  GUIDED_BREATHING: 33,
  GYMNASTICS: 34,
  HANDBALL: 35,
  HIGH_INTENSITY_INTERVAL_TRAINING: 36,
  HIKING: 37,
  ICE_HOCKEY: 38,
  ICE_SKATING: 39,
  MARTIAL_ARTS: 44,
  PADDLING: 46,
  PARAGLIDING: 47,
  PILATES: 48,
  RACQUETBALL: 50,
  ROCK_CLIMBING: 51,
  ROLLER_HOCKEY: 52,
  ROWING: 53,
  ROWING_MACHINE: 54,
  RUGBY: 55,
  RUNNING: 56,
  RUNNING_TREADMILL: 57,
  SAILING: 58,
  SCUBA_DIVING: 59,
  SKATING: 60,
  SKIING: 61,
  SNOWBOARDING: 62,
  SNOWSHOEING: 63,
  SOCCER: 64,
  SOFTBALL: 65,
  SQUASH: 66,
  STAIR_CLIMBING: 68,
  STAIR_CLIMBING_MACHINE: 69,
  STRENGTH_TRAINING: 70,
  STRETCHING: 71,
  SURFING: 72,
  SWIMMING_OPEN_WATER: 73,
  SWIMMING_POOL: 74,
  TABLE_TENNIS: 75,
  TENNIS: 76,
  VOLLEYBALL: 78,
  WALKING: 79,
  WATER_POLO: 80,
  WEIGHTLIFTING: 81,
  WHEELCHAIR: 82,
  /** @deprecated Use {@link ExerciseType.WHEELCHAIR}. */
  WHEEL_CHAIR: 82,
  YOGA: 83,
} as const;

/**
 * `ExerciseSegment.EXERCISE_SEGMENT_TYPE_*` — values match connect-client 1.2.
 * Use on `ExerciseSession.segments[].segmentType`, not `exerciseType`.
 */
/** `PlannedExerciseStep.EXERCISE_PHASE_*` */
export const ExercisePhase = {
  UNKNOWN: 0,
  WARMUP: 1,
  REST: 2,
  ACTIVE: 3,
  COOLDOWN: 4,
  RECOVERY: 5,
} as const;

export const ExerciseSegmentType = {
  UNKNOWN: 0,
  ARM_CURL: 1,
  BACK_EXTENSION: 2,
  BALL_SLAM: 3,
  BARBELL_SHOULDER_PRESS: 4,
  BENCH_PRESS: 5,
  BENCH_SIT_UP: 6,
  BIKING: 7,
  BIKING_STATIONARY: 8,
  BURPEE: 9,
  CRUNCH: 10,
  DEADLIFT: 11,
  DOUBLE_ARM_TRICEPS_EXTENSION: 12,
  DUMBBELL_CURL_LEFT_ARM: 13,
  DUMBBELL_CURL_RIGHT_ARM: 14,
  DUMBBELL_FRONT_RAISE: 15,
  DUMBBELL_LATERAL_RAISE: 16,
  DUMBBELL_ROW: 17,
  DUMBBELL_TRICEPS_EXTENSION_LEFT_ARM: 18,
  DUMBBELL_TRICEPS_EXTENSION_RIGHT_ARM: 19,
  DUMBBELL_TRICEPS_EXTENSION_TWO_ARM: 20,
  ELLIPTICAL: 21,
  FORWARD_TWIST: 22,
  FRONT_RAISE: 23,
  HIGH_INTENSITY_INTERVAL_TRAINING: 24,
  HIP_THRUST: 25,
  HULA_HOOP: 26,
  JUMPING_JACK: 27,
  JUMP_ROPE: 28,
  KETTLEBELL_SWING: 29,
  LATERAL_RAISE: 30,
  LAT_PULL_DOWN: 31,
  LEG_CURL: 32,
  LEG_EXTENSION: 33,
  LEG_PRESS: 34,
  LEG_RAISE: 35,
  LUNGE: 36,
  MOUNTAIN_CLIMBER: 37,
  OTHER_WORKOUT: 38,
  PAUSE: 39,
  PILATES: 40,
  PLANK: 41,
  PULL_UP: 42,
  PUNCH: 43,
  REST: 44,
  ROWING_MACHINE: 45,
  RUNNING: 46,
  RUNNING_TREADMILL: 47,
  SHOULDER_PRESS: 48,
  SINGLE_ARM_TRICEPS_EXTENSION: 49,
  SIT_UP: 50,
  SQUAT: 51,
  STAIR_CLIMBING: 52,
  STAIR_CLIMBING_MACHINE: 53,
  STRETCHING: 54,
  SWIMMING_BACKSTROKE: 55,
  SWIMMING_BREASTSTROKE: 56,
  SWIMMING_BUTTERFLY: 57,
  SWIMMING_FREESTYLE: 58,
  SWIMMING_MIXED: 59,
  SWIMMING_OPEN_WATER: 60,
  SWIMMING_OTHER: 61,
  SWIMMING_POOL: 62,
  UPPER_TWIST: 63,
  WALKING: 64,
  WEIGHTLIFTING: 65,
  WHEELCHAIR: 66,
  YOGA: 67,
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
