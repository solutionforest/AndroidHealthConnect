import { TurboModuleRegistry } from 'react-native';
import {
  ensurePermissions,
  timeRangeLastDays,
  timeRangeLastHours,
  timeRangeToday,
  waitForRecords,
  WaitForRecordsTimeoutError,
  WaitTimeoutError,
  pollUntil,
  waitUntil,
  readAllRecords,
  pullChanges,
  Permission,
  aggregateRecord,
} from '../index';
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
      updateRecords: jest.fn(),
      deleteRecordsByTime: jest.fn(),
      deleteRecordsById: jest.fn(),
      aggregateRecord: jest.fn(),
      aggregateGroupByDuration: jest.fn(),
      aggregateGroupByPeriod: jest.fn(),
      getChangesToken: jest.fn(),
      getChanges: jest.fn(),
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

beforeEach(() => jest.clearAllMocks());

describe('time range helpers', () => {
  it('timeRangeLastHours builds Instant window', () => {
    const end = new Date('2024-01-02T12:00:00.000Z');
    expect(timeRangeLastHours(2, end)).toEqual({
      startTime: '2024-01-02T10:00:00.000Z',
      endTime: '2024-01-02T12:00:00.000Z',
    });
  });

  it('timeRangeLastDays builds Instant window', () => {
    const end = new Date('2024-01-08T00:00:00.000Z');
    expect(timeRangeLastDays(7, end)).toEqual({
      startTime: '2024-01-01T00:00:00.000Z',
      endTime: '2024-01-08T00:00:00.000Z',
    });
  });

  it('timeRangeToday starts at local midnight', () => {
    const now = new Date('2024-06-15T15:30:00');
    const range = timeRangeToday(now);
    const start = new Date(range.startTime);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(range.endTime).toBe(now.toISOString());
  });

  it('rejects non-positive spans', () => {
    expect(() => timeRangeLastHours(0)).toThrow(/hours/);
    expect(() => timeRangeLastDays(-1)).toThrow(/days/);
  });
});

describe('ensurePermissions', () => {
  it('requests when missing then re-checks', async () => {
    mockNative.checkPermissions
      .mockResolvedValueOnce([]) // missingPermissions
      .mockResolvedValueOnce([Permission.READ_STEPS]) // missing after request
      .mockResolvedValueOnce([Permission.READ_STEPS]); // granted list
    mockNative.requestPermissions.mockResolvedValue([Permission.READ_STEPS]);

    const result = await ensurePermissions([Permission.READ_STEPS]);
    expect(mockNative.requestPermissions).toHaveBeenCalled();
    expect(result.allGranted).toBe(true);
    expect(result.granted).toEqual([Permission.READ_STEPS]);
    expect(result.missing).toEqual([]);
  });

  it('skips dialog when requestIfMissing is false', async () => {
    mockNative.checkPermissions
      .mockResolvedValueOnce([]) // missing
      .mockResolvedValueOnce([]); // granted
    const result = await ensurePermissions([Permission.READ_STEPS], {
      requestIfMissing: false,
    });
    expect(mockNative.requestPermissions).not.toHaveBeenCalled();
    expect(result.allGranted).toBe(false);
    expect(result.missing).toEqual([Permission.READ_STEPS]);
  });
});

describe('pollUntil / waitUntil', () => {
  it('pollUntil returns last value soft on timeout (resume UX)', async () => {
    mockNative.aggregateRecord
      .mockResolvedValueOnce(
        JSON.stringify({
          recordType: 'Steps',
          dataOrigins: [],
          metrics: { COUNT_TOTAL: 0 },
        })
      )
      .mockResolvedValue(
        JSON.stringify({
          recordType: 'Steps',
          dataOrigins: [],
          metrics: { COUNT_TOTAL: 0 },
        })
      );

    const result = await pollUntil(
      () =>
        aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter: timeRangeLastHours(1),
        }),
      {
        ready: (r) => {
          const n = r.metrics['COUNT_TOTAL'];
          return typeof n === 'number' && n > 0;
        },
        intervalMs: 5,
        timeoutMs: 20,
        throwOnTimeout: false,
      }
    );
    expect(result.satisfied).toBe(false);
    expect(result.value.metrics['COUNT_TOTAL']).toBe(0);
    expect(result.attempts).toBeGreaterThanOrEqual(1);
  });

  it('pollUntil satisfies when aggregate becomes non-zero', async () => {
    mockNative.aggregateRecord
      .mockResolvedValueOnce(
        JSON.stringify({
          recordType: 'Steps',
          dataOrigins: [],
          metrics: { COUNT_TOTAL: 0 },
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          recordType: 'Steps',
          dataOrigins: [],
          metrics: { COUNT_TOTAL: 4200 },
        })
      );

    const result = await pollUntil(
      () =>
        aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter: timeRangeToday(),
        }),
      {
        ready: (r) => {
          const n = r.metrics['COUNT_TOTAL'];
          return typeof n === 'number' && n > 0;
        },
        intervalMs: 1,
        timeoutMs: 1000,
      }
    );
    expect(result.satisfied).toBe(true);
    expect(result.value.metrics['COUNT_TOTAL']).toBe(4200);
  });

  it('waitUntil throws WaitTimeoutError', async () => {
    let n = 0;
    await expect(
      waitUntil(
        async () => {
          n += 1;
          return n;
        },
        { ready: () => false, intervalMs: 5, timeoutMs: 20 }
      )
    ).rejects.toBeInstanceOf(WaitTimeoutError);
  });
});

describe('waitForRecords', () => {
  it('returns when minCount is met', async () => {
    mockNative.readRecords
      .mockResolvedValueOnce(JSON.stringify({ records: [], pageToken: null }))
      .mockResolvedValueOnce(
        JSON.stringify({
          records: [
            {
              recordType: 'Steps',
              count: 10,
              startTime: '2024-01-01T00:00:00Z',
              endTime: '2024-01-01T01:00:00Z',
            },
          ],
          pageToken: null,
        })
      );

    const page = await waitForRecords({
      recordType: 'Steps',
      timeRangeFilter: timeRangeLastDays(1, new Date('2024-01-02T00:00:00Z')),
      intervalMs: 1,
      timeoutMs: 1000,
    });
    expect(page.records).toHaveLength(1);
    expect(mockNative.readRecords).toHaveBeenCalledTimes(2);
  });

  it('throws WaitForRecordsTimeoutError', async () => {
    mockNative.readRecords.mockResolvedValue(
      JSON.stringify({ records: [], pageToken: null })
    );
    await expect(
      waitForRecords({
        recordType: 'Steps',
        timeRangeFilter: timeRangeLastHours(1),
        intervalMs: 5,
        timeoutMs: 20,
      })
    ).rejects.toBeInstanceOf(WaitForRecordsTimeoutError);
  });
});

describe('readAllRecords', () => {
  it('follows pageToken until null', async () => {
    mockNative.readRecords
      .mockResolvedValueOnce(
        JSON.stringify({
          records: [
            {
              recordType: 'Steps',
              count: 1,
              startTime: 'a',
              endTime: 'b',
            },
          ],
          pageToken: 'p2',
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          records: [
            {
              recordType: 'Steps',
              count: 2,
              startTime: 'c',
              endTime: 'd',
            },
          ],
          pageToken: null,
        })
      );

    const records = await readAllRecords('Steps', {
      timeRangeFilter: timeRangeLastDays(1),
    });
    expect(records.map((r) => (r as { count: number }).count)).toEqual([1, 2]);
    expect(mockNative.readRecords).toHaveBeenCalledTimes(2);
  });
});

describe('pullChanges', () => {
  it('drains hasMore pages into one result', async () => {
    mockNative.getChanges
      .mockResolvedValueOnce(
        JSON.stringify({
          upsertionChanges: [
            {
              record: {
                recordType: 'Steps',
                count: 1,
                startTime: 'a',
                endTime: 'b',
              },
            },
          ],
          deletionChanges: [],
          nextChangesToken: 't2',
          hasMore: true,
          changesTokenExpired: false,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          upsertionChanges: [],
          deletionChanges: [{ recordId: 'del-1' }],
          nextChangesToken: 't3',
          hasMore: false,
          changesTokenExpired: false,
        })
      );

    const result = await pullChanges('t1', { pageSize: 100 });
    expect(result.pagesFetched).toBe(2);
    expect(result.upsertionChanges).toHaveLength(1);
    expect(result.deletionChanges).toEqual([{ recordId: 'del-1' }]);
    expect(result.nextChangesToken).toBe('t3');
    expect(mockNative.getChanges).toHaveBeenNthCalledWith(
      1,
      't1',
      JSON.stringify({ pageSize: 100 })
    );
    expect(mockNative.getChanges).toHaveBeenNthCalledWith(
      2,
      't2',
      JSON.stringify({ pageSize: 100 })
    );
  });
});
