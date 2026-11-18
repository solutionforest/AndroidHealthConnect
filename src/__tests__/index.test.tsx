import { TurboModuleRegistry } from 'react-native';
import {
  isHealthConnectAvailable,
  requestPermissions,
  checkPermissions,
  readRecords,
  writeRecords,
  deleteRecordsByTime,
  deleteRecordsById,
  openHealthConnectSettings,
  openHealthConnectApp,
  getFeatureStatus,
  checkIfMatchmakingIsPossible,
  launchMatchmaking,
  createMedicalDataSource,
  readMedicalResources,
} from '../index';
import type { Spec } from '../NativeAndroidHealthConnect';

// The mock factory runs while imports are still initializing, so the native
// stand-in has to be created inside the factory and read back afterwards.
jest.mock(
  'react-native',
  () => {
    const native = {
      isHealthConnectAvailable: jest.fn(),
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

describe('requestPermissions', () => {
  it('returns the granted permissions', async () => {
    const perms = [
      'android.permission.health.READ_STEPS',
      'android.permission.health.WRITE_STEPS',
    ];
    mockNative.requestPermissions.mockResolvedValue(perms);
    const granted = await requestPermissions(perms as any);
    expect(granted).toEqual(perms);
    expect(mockNative.requestPermissions).toHaveBeenCalledWith(perms);
  });

  it('returns empty array when user denies all', async () => {
    mockNative.requestPermissions.mockResolvedValue([]);
    const granted = await requestPermissions([
      'android.permission.health.READ_STEPS',
    ] as any);
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
    ] as any);
    expect(result).toEqual(['android.permission.health.READ_STEPS']);
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

    const { records, pageToken } = await readRecords('Steps', timeRange);

    expect(records).toHaveLength(1);
    expect(records[0]?.recordType).toBe('Steps');
    expect((records[0] as any).count).toBe(5000);
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

  it('openHealthConnectApp calls native', () => {
    openHealthConnectApp();
    expect(mockNative.openHealthConnectApp).toHaveBeenCalledTimes(1);
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

  it('launchMatchmaking forwards options', async () => {
    mockNative.launchMatchmaking.mockResolvedValue(true);
    await expect(launchMatchmaking({})).resolves.toBe(true);
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

  it('readMedicalResources parses JSON response', async () => {
    mockNative.readMedicalResources.mockResolvedValue(
      JSON.stringify({ medicalResources: [], nextPageToken: null })
    );
    const page = await readMedicalResources({ medicalResourceType: 2 });
    expect(page.medicalResources).toEqual([]);
    expect(page.nextPageToken).toBeNull();
  });
});
