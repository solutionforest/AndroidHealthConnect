// ─── Availability ────────────────────────────────────────────────────────────

/** Result of checking whether Health Connect is usable on the current device. */
export type HealthConnectAvailability =
  | 'available' // HC is installed and ready
  | 'notInstalled' // HC app needs to be installed / updated (Android 9-13)
  | 'notSupported'; // Device / OS version too old

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
  | 'android.permission.health.READ_RESTING_HEART_RATE'
  | 'android.permission.health.WRITE_RESTING_HEART_RATE'
  | 'android.permission.health.READ_RESPIRATORY_RATE'
  | 'android.permission.health.WRITE_RESPIRATORY_RATE'
  | 'android.permission.health.READ_FLOORS_CLIMBED'
  | 'android.permission.health.WRITE_FLOORS_CLIMBED'
  | 'android.permission.health.READ_ELEVATION_GAINED'
  | 'android.permission.health.WRITE_ELEVATION_GAINED'
  | (string & {}); // allow custom / future permissions

// ─── Common ───────────────────────────────────────────────────────────────────

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
  | ElevationGainedRecord;

export type RecordType = HealthRecord['recordType'];

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
