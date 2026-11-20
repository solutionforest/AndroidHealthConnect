import { TurboModuleRegistry } from 'react-native';
import {
  isHealthConnectAvailable,
  getHealthConnectAvailability,
  requestPermissions,
  checkPermissions,
  revokeAllPermissions,
  readRecords,
  writeRecords,
  updateRecords,
  deleteRecordsByTime,
  deleteRecordsById,
  openHealthConnectSettings,
  openHealthConnectDataManagement,
  openHealthConnectApp,
  getFeatureStatus,
  checkIfMatchmakingIsPossible,
  launchMatchmaking,
  createMedicalDataSource,
  deleteMedicalDataSourceWithData,
  getMedicalDataSources,
  upsertMedicalResources,
  deleteMedicalResources,
  readMedicalResources,
  readSteps,
  aggregateRecord,
  aggregateGroupByDuration,
  aggregateGroupByPeriod,
  requestExerciseRoute,
  getChangesToken,
  getChanges,
} from '../index';
import type { Spec } from '../NativeAndroidHealthConnect';
import type { HealthPermission, StepsRecord } from '../types';

// The mock factory runs while imports are still initializing, so the native
// stand-in has to be created inside the factory and read back afterwards.
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
      updateRecords: jest.fn(),
      deleteRecordsByTime: jest.fn(),
      deleteRecordsById: jest.fn(),
      aggregateRecord: jest.fn(),
      aggregateGroupByDuration: jest.fn(),
      aggregateGroupByPeriod: jest.fn(),
      requestExerciseRoute: jest.fn(),
      getChangesToken: jest.fn(),
      getChanges: jest.fn(),
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

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks());

describe('isHealthConnectAvailable', () => {
  it('returns "available" when HC is ready', async () => {
    mockNative.isHealthConnectAvailable.mockResolvedValue('available');
    expect(await isHealthConnectAvailable()).toBe('available');
  });

  it('returns "notInstalled" when HC app is missing', async () => {
    mockNative.isHealthConnectAvailable.mockResolvedValue('notInstalled');
    expect(await isHealthConnectAvailable()).toBe('notInstalled');
  });

  it('returns "notSupported" on old OS', async () => {
    mockNative.isHealthConnectAvailable.mockResolvedValue('notSupported');
    expect(await isHealthConnectAvailable()).toBe('notSupported');
  });
});

describe('getHealthConnectAvailability', () => {
  it('parses detailed availability JSON', async () => {
    const payload = {
      status: 'notSupported',
      sdkStatus: 1,
      sdkStatusName: 'SDK_UNAVAILABLE',
      provider: 'apk',
      androidSdkInt: 33,
      googlePlayServicesAvailable: false,
      playStoreAvailable: false,
      advice: 'Health Connect is not available without Google Play services',
    };
    mockNative.getHealthConnectAvailability.mockResolvedValue(
      JSON.stringify(payload)
    );
    await expect(getHealthConnectAvailability()).resolves.toEqual(payload);
  });

  it('documents that sdkStatus 3 means available, not version-too-old', async () => {
    mockNative.getHealthConnectAvailability.mockResolvedValue(
      JSON.stringify({
        status: 'available',
        sdkStatus: 3,
        sdkStatusName: 'SDK_AVAILABLE',
        provider: 'framework',
        androidSdkInt: 34,
        googlePlayServicesAvailable: true,
        playStoreAvailable: true,
        advice: 'Health Connect is built into Android 14+ and is ready.',
      })
    );
    const info = await getHealthConnectAvailability();
    expect(info.sdkStatus).toBe(3);
    expect(info.status).toBe('available');
    expect(info.sdkStatusName).toBe('SDK_AVAILABLE');
  });
});

describe('requestPermissions', () => {
  it('returns the granted permissions', async () => {
    const perms: HealthPermission[] = [
      'android.permission.health.READ_STEPS',
      'android.permission.health.WRITE_STEPS',
    ];
    mockNative.requestPermissions.mockResolvedValue(perms);
    const granted = await requestPermissions(perms);
    expect(granted).toEqual(perms);
    expect(mockNative.requestPermissions).toHaveBeenCalledWith(perms);
  });

  it('round-trips history and background special permissions', async () => {
    const perms: HealthPermission[] = [
      'android.permission.health.READ_HEALTH_DATA_HISTORY',
      'android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND',
    ];
    mockNative.requestPermissions.mockResolvedValue(perms);
    mockNative.checkPermissions.mockResolvedValue([
      'android.permission.health.READ_HEALTH_DATA_HISTORY',
    ]);
    await expect(requestPermissions(perms)).resolves.toEqual(perms);
    await expect(checkPermissions(perms)).resolves.toEqual([
      'android.permission.health.READ_HEALTH_DATA_HISTORY',
    ]);
    expect(mockNative.requestPermissions).toHaveBeenCalledWith(perms);
    expect(mockNative.checkPermissions).toHaveBeenCalledWith(perms);
  });

  it('returns empty array when user denies all', async () => {
    mockNative.requestPermissions.mockResolvedValue([]);
    const granted = await requestPermissions([
      'android.permission.health.READ_STEPS',
    ]);
    expect(granted).toEqual([]);
  });
});

describe('checkPermissions', () => {
  it('returns only the granted subset', async () => {
    mockNative.checkPermissions.mockResolvedValue([
      'android.permission.health.READ_STEPS',
    ]);
    const result = await checkPermissions([
      'android.permission.health.READ_STEPS',
      'android.permission.health.WRITE_STEPS',
    ]);
    expect(result).toEqual(['android.permission.health.READ_STEPS']);
  });
});

describe('revokeAllPermissions', () => {
  it('forwards to native', async () => {
    mockNative.revokeAllPermissions.mockResolvedValue(true);
    await revokeAllPermissions();
    expect(mockNative.revokeAllPermissions).toHaveBeenCalledTimes(1);
  });
});

describe('readRecords', () => {
  const timeRange = {
    timeRangeFilter: {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-08T00:00:00Z',
    },
  };

  it('parses steps records', async () => {
    const payload = {
      records: [
        {
          recordType: 'Steps',
          count: 5000,
          startTime: '2024-01-01T08:00:00Z',
          endTime: '2024-01-01T09:00:00Z',
          metadata: { id: 'abc', dataOrigin: 'com.test', lastModifiedTime: '' },
        },
      ],
      pageToken: null,
    };
    mockNative.readRecords.mockResolvedValue(JSON.stringify(payload));

    const { records, pageToken } = await readRecords<StepsRecord>(
      'Steps',
      timeRange
    );

    expect(records).toHaveLength(1);
    expect(records[0]?.recordType).toBe('Steps');
    expect(records[0]?.count).toBe(5000);
    expect(pageToken).toBeNull();

    expect(mockNative.readRecords).toHaveBeenCalledWith(
      'Steps',
      JSON.stringify(timeRange)
    );
  });

  it('parses heart rate records', async () => {
    const payload = {
      records: [
        {
          recordType: 'HeartRate',
          samples: [{ time: '2024-01-01T08:00:00Z', beatsPerMinute: 72 }],
          startTime: '2024-01-01T08:00:00Z',
          endTime: '2024-01-01T09:00:00Z',
          metadata: { id: 'hr1', dataOrigin: 'com.test', lastModifiedTime: '' },
        },
      ],
      pageToken: 'next-page-token',
    };
    mockNative.readRecords.mockResolvedValue(JSON.stringify(payload));

    const { records, pageToken } = await readRecords('HeartRate', timeRange);

    expect(records).toHaveLength(1);
    expect(pageToken).toBe('next-page-token');
  });

  it('forwards pageToken for pagination', async () => {
    mockNative.readRecords.mockResolvedValue(
      JSON.stringify({ records: [], pageToken: null })
    );
    const opts = { ...timeRange, pageToken: 'some-token' };
    await readRecords('Steps', opts);
    expect(mockNative.readRecords).toHaveBeenCalledWith(
      'Steps',
      JSON.stringify(opts)
    );
  });

  it('uses default options when omitted', async () => {
    mockNative.readRecords.mockResolvedValue(
      JSON.stringify({ records: [], pageToken: null })
    );
    await readRecords('Steps');
    expect(mockNative.readRecords).toHaveBeenCalledWith('Steps', '{}');
  });

  it('readSteps convenience helper uses default options', async () => {
    mockNative.readRecords.mockResolvedValue(
      JSON.stringify({ records: [], pageToken: null })
    );
    await readSteps();
    expect(mockNative.readRecords).toHaveBeenCalledWith('Steps', '{}');
  });
});

describe('writeRecords', () => {
  it('returns inserted record IDs', async () => {
    mockNative.writeRecords.mockResolvedValue(
      JSON.stringify({ recordIdsList: ['id-001', 'id-002'] })
    );
    const { recordIdsList } = await writeRecords([
      {
        recordType: 'Steps',
        count: 1000,
        startTime: '2024-01-01T08:00:00Z',
        endTime: '2024-01-01T09:00:00Z',
      },
    ]);
    expect(recordIdsList).toEqual(['id-001', 'id-002']);
  });

  it('serialises the records array to JSON', async () => {
    mockNative.writeRecords.mockResolvedValue(
      JSON.stringify({ recordIdsList: [] })
    );
    const records = [
      {
        recordType: 'Weight' as const,
        weight: 75,
        time: '2024-01-01T07:00:00Z',
      },
    ];
    await writeRecords(records);
    expect(mockNative.writeRecords).toHaveBeenCalledWith(
      JSON.stringify(records)
    );
  });
});

describe('updateRecords', () => {
  it('forwards records JSON to native', async () => {
    mockNative.updateRecords.mockResolvedValue(true);
    const records = [
      {
        recordType: 'Steps' as const,
        count: 2000,
        startTime: '2024-01-01T08:00:00Z',
        endTime: '2024-01-01T09:00:00Z',
        metadata: { id: 'existing-id' },
      },
    ];
    await updateRecords(records);
    expect(mockNative.updateRecords).toHaveBeenCalledWith(
      JSON.stringify(records)
    );
  });
});

describe('deleteRecordsByTime', () => {
  it('calls native with correct arguments', async () => {
    mockNative.deleteRecordsByTime.mockResolvedValue(true);
    await deleteRecordsByTime(
      'Steps',
      '2024-01-01T00:00:00Z',
      '2024-01-02T00:00:00Z'
    );
    expect(mockNative.deleteRecordsByTime).toHaveBeenCalledWith(
      'Steps',
      '2024-01-01T00:00:00Z',
      '2024-01-02T00:00:00Z'
    );
  });
});

describe('deleteRecordsById', () => {
  it('calls native with record IDs', async () => {
    mockNative.deleteRecordsById.mockResolvedValue(true);
    await deleteRecordsById('Steps', ['id-1', 'id-2']);
    expect(mockNative.deleteRecordsById).toHaveBeenCalledWith('Steps', [
      'id-1',
      'id-2',
    ]);
  });
});

describe('navigation helpers', () => {
  it('openHealthConnectSettings calls native', () => {
    openHealthConnectSettings();
    expect(mockNative.openHealthConnectSettings).toHaveBeenCalledTimes(1);
  });

  it('openHealthConnectDataManagement forwards package name', () => {
    openHealthConnectDataManagement('com.example.app');
    expect(mockNative.openHealthConnectDataManagement).toHaveBeenCalledWith(
      'com.example.app'
    );
  });

  it('openHealthConnectDataManagement defaults to empty package', () => {
    openHealthConnectDataManagement();
    expect(mockNative.openHealthConnectDataManagement).toHaveBeenCalledWith('');
  });

  it('openHealthConnectApp calls native', () => {
    openHealthConnectApp();
    expect(mockNative.openHealthConnectApp).toHaveBeenCalledTimes(1);
  });
});

describe('aggregates', () => {
  const range = {
    timeRangeFilter: {
      startTime: '2024-01-01T00:00:00Z',
      endTime: '2024-01-02T00:00:00Z',
    },
  };

  it('aggregateRecord parses Steps COUNT_TOTAL', async () => {
    mockNative.aggregateRecord.mockResolvedValue(
      JSON.stringify({
        recordType: 'Steps',
        dataOrigins: ['com.test'],
        metrics: { COUNT_TOTAL: 5000 },
      })
    );
    const result = await aggregateRecord({ recordType: 'Steps', ...range });
    expect(result.metrics['COUNT_TOTAL']).toBe(5000);
    expect(mockNative.aggregateRecord).toHaveBeenCalledWith(
      JSON.stringify({ recordType: 'Steps', ...range })
    );
  });

  it('aggregateGroupByDuration returns Instant buckets', async () => {
    mockNative.aggregateGroupByDuration.mockResolvedValue(
      JSON.stringify([
        {
          startTime: '2024-01-01T00:00:00Z',
          endTime: '2024-01-01T01:00:00Z',
          zoneOffset: '+08:00',
          result: {
            recordType: 'Steps',
            dataOrigins: [],
            metrics: { COUNT_TOTAL: 100 },
          },
        },
      ])
    );
    const rows = await aggregateGroupByDuration({
      recordType: 'Steps',
      ...range,
      timeRangeSlicer: { unit: 'hours', value: 1 },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.startTime).toBe('2024-01-01T00:00:00Z');
    expect(rows[0]?.result.metrics['COUNT_TOTAL']).toBe(100);
  });

  it('aggregateGroupByPeriod returns period buckets', async () => {
    mockNative.aggregateGroupByPeriod.mockResolvedValue(
      JSON.stringify([
        {
          startTime: '2024-01-01T00:00',
          endTime: '2024-01-02T00:00',
          result: {
            recordType: 'Steps',
            dataOrigins: [],
            metrics: { COUNT_TOTAL: 9000 },
          },
        },
      ])
    );
    const rows = await aggregateGroupByPeriod({
      recordType: 'Steps',
      ...range,
      timeRangeSlicer: { unit: 'days', value: 1 },
    });
    expect(rows[0]?.result.metrics['COUNT_TOTAL']).toBe(9000);
  });
});

describe('exercise route', () => {
  it('requestExerciseRoute parses DATA result', async () => {
    mockNative.requestExerciseRoute.mockResolvedValue(
      JSON.stringify({
        type: 'DATA',
        route: [
          {
            time: '2024-01-01T08:00:00Z',
            latitude: 51.5,
            longitude: -0.12,
            altitude: { inMeters: 10, inKilometers: 0.01, inMiles: 0.006 },
          },
        ],
      })
    );
    const result = await requestExerciseRoute('session-id');
    expect(result?.type).toBe('DATA');
    expect(result?.route).toHaveLength(1);
    expect(mockNative.requestExerciseRoute).toHaveBeenCalledWith('session-id');
  });

  it('requestExerciseRoute returns null when denied', async () => {
    mockNative.requestExerciseRoute.mockResolvedValue('');
    await expect(requestExerciseRoute('session-id')).resolves.toBeNull();
  });
});

describe('changelog / changes token', () => {
  it('getChangesToken forwards request JSON', async () => {
    mockNative.getChangesToken.mockResolvedValue('token-abc');
    await expect(
      getChangesToken({ recordTypes: ['Steps', 'Weight'] })
    ).resolves.toBe('token-abc');
    expect(mockNative.getChangesToken).toHaveBeenCalledWith(
      JSON.stringify({ recordTypes: ['Steps', 'Weight'] })
    );
  });

  it('getChanges parses upsertion and deletion pages', async () => {
    mockNative.getChanges.mockResolvedValue(
      JSON.stringify({
        upsertionChanges: [
          {
            record: {
              recordType: 'Steps',
              count: 100,
              startTime: '2024-01-01T08:00:00Z',
              endTime: '2024-01-01T09:00:00Z',
            },
          },
        ],
        deletionChanges: [{ recordId: 'deleted-1' }],
        nextChangesToken: 'token-next',
        hasMore: true,
        changesTokenExpired: false,
      })
    );
    const result = await getChanges('token-abc');
    expect(result.upsertionChanges).toHaveLength(1);
    expect(result.deletionChanges[0]?.recordId).toBe('deleted-1');
    expect(result.nextChangesToken).toBe('token-next');
    expect(result.hasMore).toBe(true);
    expect(mockNative.getChanges).toHaveBeenCalledWith('token-abc', '{}');
  });

  it('getChanges forwards pageSize option', async () => {
    mockNative.getChanges.mockResolvedValue(
      JSON.stringify({
        upsertionChanges: [],
        deletionChanges: [],
        nextChangesToken: 't',
        hasMore: false,
        changesTokenExpired: false,
      })
    );
    await getChanges('token-abc', { pageSize: 100 });
    expect(mockNative.getChanges).toHaveBeenCalledWith(
      'token-abc',
      JSON.stringify({ pageSize: 100 })
    );
  });
});

describe('feature / matchmaking / PHR helpers', () => {
  it('getFeatureStatus forwards feature name', async () => {
    mockNative.getFeatureStatus.mockResolvedValue('available');
    await expect(getFeatureStatus('skinTemperature')).resolves.toBe(
      'available'
    );
    expect(mockNative.getFeatureStatus).toHaveBeenCalledWith('skinTemperature');
  });

  it('checkIfMatchmakingIsPossible parses JSON response', async () => {
    mockNative.checkIfMatchmakingIsPossible.mockResolvedValue(
      JSON.stringify({ isMatchmakingPossible: true })
    );
    const result = await checkIfMatchmakingIsPossible({
      recordTypes: ['Steps'],
    });
    expect(result.isMatchmakingPossible).toBe(true);
    expect(mockNative.checkIfMatchmakingIsPossible).toHaveBeenCalledWith(
      JSON.stringify({ recordTypes: ['Steps'] })
    );
  });

  it('checkIfMatchmakingIsPossible uses default options', async () => {
    mockNative.checkIfMatchmakingIsPossible.mockResolvedValue(
      JSON.stringify({ isMatchmakingPossible: false })
    );
    await expect(checkIfMatchmakingIsPossible()).resolves.toEqual({
      isMatchmakingPossible: false,
    });
    expect(mockNative.checkIfMatchmakingIsPossible).toHaveBeenCalledWith('{}');
  });

  it('launchMatchmaking forwards options', async () => {
    mockNative.launchMatchmaking.mockResolvedValue(true);
    await expect(launchMatchmaking({})).resolves.toBe(true);
    expect(mockNative.launchMatchmaking).toHaveBeenCalledWith('{}');
  });

  it('launchMatchmaking uses default options', async () => {
    mockNative.launchMatchmaking.mockResolvedValue(false);
    await expect(launchMatchmaking()).resolves.toBe(false);
    expect(mockNative.launchMatchmaking).toHaveBeenCalledWith('{}');
  });

  it('createMedicalDataSource parses JSON response', async () => {
    const source = {
      id: 'ds-1',
      displayName: 'Clinic',
      fhirBaseUri: 'https://example.com/fhir/',
      fhirVersion: { major: 4, minor: 0, patch: 1 },
    };
    mockNative.createMedicalDataSource.mockResolvedValue(
      JSON.stringify(source)
    );
    await expect(
      createMedicalDataSource({
        displayName: 'Clinic',
        fhirBaseUri: 'https://example.com/fhir/',
        fhirVersion: { major: 4, minor: 0, patch: 1 },
      })
    ).resolves.toEqual(source);
  });

  it('deleteMedicalDataSourceWithData forwards id', async () => {
    mockNative.deleteMedicalDataSourceWithData.mockResolvedValue(true);
    await deleteMedicalDataSourceWithData('ds-1');
    expect(mockNative.deleteMedicalDataSourceWithData).toHaveBeenCalledWith(
      'ds-1'
    );
  });

  it('readMedicalResources parses JSON response', async () => {
    mockNative.readMedicalResources.mockResolvedValue(
      JSON.stringify({ medicalResources: [], nextPageToken: null })
    );
    const page = await readMedicalResources({ medicalResourceType: 2 });
    expect(page.medicalResources).toEqual([]);
    expect(page.nextPageToken).toBeNull();
  });

  it('getMedicalDataSources parses JSON response', async () => {
    mockNative.getMedicalDataSources.mockResolvedValue(JSON.stringify([]));
    await expect(getMedicalDataSources({})).resolves.toEqual([]);
    expect(mockNative.getMedicalDataSources).toHaveBeenCalledWith('{}');
  });

  it('getMedicalDataSources uses default options', async () => {
    mockNative.getMedicalDataSources.mockResolvedValue(JSON.stringify([]));
    await expect(getMedicalDataSources()).resolves.toEqual([]);
    expect(mockNative.getMedicalDataSources).toHaveBeenCalledWith('{}');
  });

  it('upsertMedicalResources parses JSON response', async () => {
    mockNative.upsertMedicalResources.mockResolvedValue(JSON.stringify([]));
    const requests = [
      {
        dataSourceId: 'ds-1',
        fhirVersion: { major: 4, minor: 0, patch: 1 },
        data: '{"resourceType":"Observation"}',
      },
    ];
    await expect(upsertMedicalResources(requests)).resolves.toEqual([]);
    expect(mockNative.upsertMedicalResources).toHaveBeenCalledWith(
      JSON.stringify(requests)
    );
  });

  it('deleteMedicalResources forwards request', async () => {
    mockNative.deleteMedicalResources.mockResolvedValue(true);
    const request = {
      ids: [
        {
          dataSourceId: 'ds-1',
          fhirResourceType: 1,
          fhirResourceId: 'mr-1',
        },
      ],
    };
    await deleteMedicalResources(request);
    expect(mockNative.deleteMedicalResources).toHaveBeenCalledWith(
      JSON.stringify(request)
    );
  });
});
