import { TurboModuleRegistry } from 'react-native';
import {
  readRecords,
  writeRecords,
  readSteps,
  readHeartRate,
  readSleepSessions,
  readActiveCaloriesBurned,
  readTotalCaloriesBurned,
  readDistance,
  readWeight,
  readHeight,
  readBloodPressure,
  readBloodGlucose,
  readOxygenSaturation,
  readBodyTemperature,
  readBodyFat,
  readHydration,
  readExerciseSessions,
  readRestingHeartRate,
  readRespiratoryRate,
  readFloorsClimbed,
  readElevationGained,
  readMindfulnessSessions,
  readSkinTemperature,
  readActivityIntensity,
  MindfulnessSessionType,
  ActivityIntensityType,
  SkinTemperatureMeasurementLocation,
} from '../index';
import type { HealthRecord, RecordType } from '../types';
import type { Spec } from '../NativeAndroidHealthConnect';

jest.mock(
  'react-native',
  () => {
    const native = {
      isHealthConnectAvailable: jest.fn(),
      getHealthConnectAvailability: jest.fn(),
      requestPermissions: jest.fn(),
      checkPermissions: jest.fn(),
      revokeAllPermissions: jest.fn(),
      openHealthConnectSettings: jest.fn(),
      openHealthConnectDataManagement: jest.fn(),
      openHealthConnectApp: jest.fn(),
      readRecords: jest.fn(),
      writeRecords: jest.fn(),
      deleteRecordsByTime: jest.fn(),
      deleteRecordsById: jest.fn(),
      aggregateRecord: jest.fn(),
      aggregateGroupByDuration: jest.fn(),
      aggregateGroupByPeriod: jest.fn(),
      requestExerciseRoute: jest.fn(),
      getFeatureStatus: jest.fn(),
      checkIfMatchmakingIsPossible: jest.fn(),
      launchMatchmaking: jest.fn(),
      createMedicalDataSource: jest.fn(),
      deleteMedicalDataSourceWithData: jest.fn(),
      getMedicalDataSources: jest.fn(),
      upsertMedicalResources: jest.fn(),
      readMedicalResources: jest.fn(),
      deleteMedicalResources: jest.fn(),
    };

    return {
      TurboModuleRegistry: {
        getEnforcing: () => native,
      },
      Platform: { OS: 'android' },
    };
  },
  { virtual: true }
);

const mockNative = TurboModuleRegistry.getEnforcing<Spec>(
  'AndroidHealthConnect'
) as jest.Mocked<Spec>;

const timeRange = {
  timeRangeFilter: {
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-01-08T00:00:00Z',
  },
};

const interval = {
  startTime: '2024-01-01T08:00:00Z',
  endTime: '2024-01-01T09:00:00Z',
};

const instant = { time: '2024-01-01T08:00:00Z' };

type RecordCase = {
  recordType: RecordType;
  sample: HealthRecord;
  readHelper?: (options?: typeof timeRange) => Promise<unknown>;
};

/**
 * Table mirrors README "Supported record types" — read + write via JS API.
 * Native Health Connect is mocked; Kotlin RecordMapper tests cover mapping.
 */
const RECORD_CASES: RecordCase[] = [
  {
    recordType: 'Steps',
    sample: { recordType: 'Steps', count: 5000, ...interval },
    readHelper: readSteps,
  },
  {
    recordType: 'HeartRate',
    sample: {
      recordType: 'HeartRate',
      samples: [{ time: instant.time, beatsPerMinute: 72 }],
      ...interval,
    },
    readHelper: readHeartRate,
  },
  {
    recordType: 'SleepSession',
    sample: {
      recordType: 'SleepSession',
      ...interval,
      stages: [{ ...interval, stage: 5 }],
    },
    readHelper: readSleepSessions,
  },
  {
    recordType: 'ActiveCaloriesBurned',
    sample: { recordType: 'ActiveCaloriesBurned', energy: 120, ...interval },
    readHelper: readActiveCaloriesBurned,
  },
  {
    recordType: 'TotalCaloriesBurned',
    sample: { recordType: 'TotalCaloriesBurned', energy: 1800, ...interval },
    readHelper: readTotalCaloriesBurned,
  },
  {
    recordType: 'Distance',
    sample: { recordType: 'Distance', distance: 3200, ...interval },
    readHelper: readDistance,
  },
  {
    recordType: 'Weight',
    sample: { recordType: 'Weight', weight: 72.5, ...instant },
    readHelper: readWeight,
  },
  {
    recordType: 'Height',
    sample: { recordType: 'Height', height: 1.75, ...instant },
    readHelper: readHeight,
  },
  {
    recordType: 'BloodPressure',
    sample: {
      recordType: 'BloodPressure',
      systolic: 120,
      diastolic: 80,
      ...instant,
    },
    readHelper: readBloodPressure,
  },
  {
    recordType: 'BloodGlucose',
    sample: { recordType: 'BloodGlucose', level: 5.4, ...instant },
    readHelper: readBloodGlucose,
  },
  {
    recordType: 'OxygenSaturation',
    sample: { recordType: 'OxygenSaturation', percentage: 98, ...instant },
    readHelper: readOxygenSaturation,
  },
  {
    recordType: 'BodyTemperature',
    sample: { recordType: 'BodyTemperature', temperature: 36.6, ...instant },
    readHelper: readBodyTemperature,
  },
  {
    recordType: 'BodyFat',
    sample: { recordType: 'BodyFat', percentage: 18.5, ...instant },
    readHelper: readBodyFat,
  },
  {
    recordType: 'Hydration',
    sample: { recordType: 'Hydration', volume: 0.5, ...interval },
    readHelper: readHydration,
  },
  {
    recordType: 'ExerciseSession',
    sample: {
      recordType: 'ExerciseSession',
      exerciseType: 56,
      ...interval,
      title: 'Run',
    },
    readHelper: readExerciseSessions,
  },
  {
    recordType: 'RestingHeartRate',
    sample: {
      recordType: 'RestingHeartRate',
      beatsPerMinute: 58,
      ...instant,
    },
    readHelper: readRestingHeartRate,
  },
  {
    recordType: 'RespiratoryRate',
    sample: { recordType: 'RespiratoryRate', rate: 16, ...instant },
    readHelper: readRespiratoryRate,
  },
  {
    recordType: 'FloorsClimbed',
    sample: { recordType: 'FloorsClimbed', floors: 3, ...interval },
    readHelper: readFloorsClimbed,
  },
  {
    recordType: 'ElevationGained',
    sample: { recordType: 'ElevationGained', elevation: 40, ...interval },
    readHelper: readElevationGained,
  },
  {
    recordType: 'MindfulnessSession',
    sample: {
      recordType: 'MindfulnessSession',
      mindfulnessSessionType: MindfulnessSessionType.MEDITATION,
      title: 'Lake meditation',
      ...interval,
    },
    readHelper: readMindfulnessSessions,
  },
  {
    recordType: 'SkinTemperature',
    sample: {
      recordType: 'SkinTemperature',
      deltas: [{ time: instant.time, delta: 0.2 }],
      baseline: 33.5,
      measurementLocation: SkinTemperatureMeasurementLocation.WRIST,
      ...interval,
    },
    readHelper: readSkinTemperature,
  },
  {
    recordType: 'ActivityIntensity',
    sample: {
      recordType: 'ActivityIntensity',
      activityIntensityType: ActivityIntensityType.MODERATE,
      ...interval,
    },
    readHelper: readActivityIntensity,
  },
];

beforeEach(() => jest.clearAllMocks());

describe('Supported record types (README table)', () => {
  it('covers all 22 documented record types', () => {
    expect(RECORD_CASES).toHaveLength(22);
    expect(new Set(RECORD_CASES.map((c) => c.recordType)).size).toBe(22);
  });

  describe.each(RECORD_CASES)(
    '$recordType',
    ({ recordType, sample, readHelper }) => {
      it('supports read via readRecords', async () => {
        const payload = {
          records: [sample],
          pageToken: null,
        };
        mockNative.readRecords.mockResolvedValue(JSON.stringify(payload));

        const { records, pageToken } = await readRecords(recordType, timeRange);

        expect(mockNative.readRecords).toHaveBeenCalledWith(
          recordType,
          JSON.stringify(timeRange)
        );
        expect(records).toHaveLength(1);
        expect(records[0]?.recordType).toBe(recordType);
        expect(pageToken).toBeNull();
      });

      it('supports write via writeRecords', async () => {
        mockNative.writeRecords.mockResolvedValue(
          JSON.stringify({ recordIdsList: [`${recordType}-id-1`] })
        );

        const result = await writeRecords([sample]);

        expect(mockNative.writeRecords).toHaveBeenCalledWith(
          JSON.stringify([sample])
        );
        expect(result.recordIdsList).toEqual([`${recordType}-id-1`]);
      });

      if (readHelper) {
        it('supports typed read helper', async () => {
          mockNative.readRecords.mockResolvedValue(
            JSON.stringify({ records: [sample], pageToken: null })
          );

          const { records } = (await readHelper(timeRange)) as {
            records: HealthRecord[];
          };

          expect(mockNative.readRecords).toHaveBeenCalledWith(
            recordType,
            JSON.stringify(timeRange)
          );
          expect(records[0]?.recordType).toBe(recordType);
        });
      }
    }
  );
});
