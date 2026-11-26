import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { AppState, TurboModuleRegistry } from 'react-native';
import {
  useAggregate,
  useChanges,
  useHealthConnectAvailability,
  useHealthConnectPermissions,
  useMostRecentRecord,
  useReadRecords,
} from '../index';
import type { Spec } from '../NativeAndroidHealthConnect';
import type { HealthPermission, RecordType, StepsRecord } from '../types';

jest.mock(
  'react-native',
  () => {
    const listeners = new Set<Function>();
    const native = {
      isHealthConnectAvailable: jest.fn(),
      checkPermissions: jest.fn(),
      requestPermissions: jest.fn(),
      readRecords: jest.fn(),
      aggregateRecord: jest.fn(),
      getChanges: jest.fn(),
    };
    return {
      TurboModuleRegistry: { getEnforcing: () => native },
      Platform: { OS: 'android' },
      AppState: {
        addEventListener: jest.fn((_type: string, cb: Function) => {
          listeners.add(cb);
          return { remove: () => listeners.delete(cb) };
        }),
        emit: (next: string) => listeners.forEach((cb) => cb(next)),
        listenerCount: () => listeners.size,
      },
    };
  },
  { virtual: true }
);

const mockNative = TurboModuleRegistry.getEnforcing<Spec>(
  'AndroidHealthConnect'
) as jest.Mocked<Spec>;

const appState = AppState as unknown as {
  emit: (state: string) => void;
  listenerCount: () => number;
};

const STEPS = 'Steps' as RecordType;
const WEIGHT = 'Weight' as RecordType;
const READ_STEPS = 'android.permission.health.READ_STEPS' as HealthPermission;
const READ_HR = 'android.permission.health.READ_HEART_RATE' as HealthPermission;

const flush = async () => {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
};

const mounted = new Set<ReactTestRenderer>();

/** Renders `useHook` and exposes the latest return value. */
function renderHook<P, R>(useHook: (props: P) => R, initialProps: P) {
  const result: { current: R } = { current: undefined as R };
  function Probe(props: { p: P }) {
    result.current = useHook(props.p);
    return null;
  }
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<Probe p={initialProps} />);
  });
  mounted.add(renderer);
  return {
    result,
    rerender: (p: P) => act(() => renderer.update(<Probe p={p} />)),
    unmount: () => {
      mounted.delete(renderer);
      act(() => renderer.unmount());
    },
  };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const page = (records: unknown[], pageToken: string | null = null) =>
  JSON.stringify({ records, pageToken });

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Unmount anything a failed test left behind so failures don't cascade.
  mounted.forEach((r) => {
    act(() => {
      r.unmount();
    });
  });
  mounted.clear();
  jest.useRealTimers();
  expect(appState.listenerCount()).toBe(0);
});

describe('useHealthConnectAvailability', () => {
  it('loads on mount and re-checks on resume', async () => {
    mockNative.isHealthConnectAvailable.mockResolvedValueOnce('notInstalled');
    const { result, unmount } = renderHook(
      () => useHealthConnectAvailability(),
      {}
    );
    expect(result.current.loading).toBe(true);
    await flush();
    expect(result.current.value).toBe('notInstalled');
    expect(result.current.loading).toBe(false);
    expect(result.current.satisfied).toBe(true);

    mockNative.isHealthConnectAvailable.mockResolvedValueOnce('available');
    act(() => appState.emit('active'));
    await flush();
    expect(result.current.value).toBe('available');
    expect(mockNative.isHealthConnectAvailable).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('does not fetch while disabled', async () => {
    const { result, unmount } = renderHook(
      () => useHealthConnectAvailability({ enabled: false }),
      {}
    );
    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.value).toBeUndefined();
    expect(mockNative.isHealthConnectAvailable).not.toHaveBeenCalled();
    unmount();
  });

  it('reports errors and keeps loading false', async () => {
    const boom = new Error('boom');
    mockNative.isHealthConnectAvailable.mockRejectedValueOnce(boom);
    const { result, unmount } = renderHook(
      () => useHealthConnectAvailability(),
      {}
    );
    await flush();
    expect(result.current.error).toBe(boom);
    expect(result.current.loading).toBe(false);

    mockNative.isHealthConnectAvailable.mockResolvedValueOnce('available');
    act(() => result.current.refresh());
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
    await flush();
    expect(result.current.value).toBe('available');
    unmount();
  });

  it('drops a result that arrives after unmount', async () => {
    const pending = deferred<string>();
    mockNative.isHealthConnectAvailable.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(
      () => useHealthConnectAvailability(),
      {}
    );
    const before = result.current;
    unmount();
    pending.resolve('available');
    await flush();
    expect(result.current).toBe(before);
    expect(result.current.value).toBeUndefined();
  });
});

describe('useHealthConnectPermissions', () => {
  it('reports granted and missing permissions', async () => {
    mockNative.checkPermissions.mockResolvedValue([READ_STEPS]);
    const { result, unmount } = renderHook(
      () => useHealthConnectPermissions([READ_STEPS, READ_HR]),
      {}
    );
    await flush();
    const [status] = result.current;
    expect(status.value).toEqual({
      granted: [READ_STEPS],
      missing: [READ_HR],
      allGranted: false,
    });
    unmount();
  });

  it('request asks only for missing permissions and refreshes the status', async () => {
    mockNative.checkPermissions.mockResolvedValue([READ_STEPS]);
    const { result, unmount } = renderHook(
      () => useHealthConnectPermissions([READ_STEPS, READ_HR]),
      {}
    );
    await flush();

    mockNative.requestPermissions.mockResolvedValue([READ_HR]);
    mockNative.checkPermissions
      .mockResolvedValueOnce([READ_STEPS])
      .mockResolvedValue([READ_STEPS, READ_HR]);
    let outcome: unknown;
    await act(async () => {
      outcome = await result.current[1]();
    });
    await flush();

    expect(mockNative.requestPermissions).toHaveBeenCalledWith([READ_HR]);
    expect(outcome).toEqual({
      granted: [READ_STEPS, READ_HR],
      missing: [],
      allGranted: true,
    });
    expect(result.current[0].value?.allGranted).toBe(true);
    unmount();
  });

  it('request skips the dialog when everything is granted', async () => {
    mockNative.checkPermissions.mockResolvedValue([READ_STEPS]);
    const { result, unmount } = renderHook(
      () => useHealthConnectPermissions([READ_STEPS]),
      {}
    );
    await flush();
    await act(async () => {
      await result.current[1]();
    });
    expect(mockNative.requestPermissions).not.toHaveBeenCalled();
    unmount();
  });

  it('treats an empty list as granted without a native call', async () => {
    const { result, unmount } = renderHook(
      () => useHealthConnectPermissions([]),
      {}
    );
    await flush();
    expect(result.current[0].value?.allGranted).toBe(true);
    expect(mockNative.checkPermissions).not.toHaveBeenCalled();
    unmount();
  });

  it('does not refetch when an inline array keeps the same contents', async () => {
    mockNative.checkPermissions.mockResolvedValue([READ_STEPS]);
    const { rerender, unmount } = renderHook(
      (perms: HealthPermission[]) => useHealthConnectPermissions(perms),
      [READ_STEPS]
    );
    await flush();
    rerender([READ_STEPS]);
    await flush();
    expect(mockNative.checkPermissions).toHaveBeenCalledTimes(1);
    unmount();
  });
});

describe('useReadRecords', () => {
  const range = {
    startTime: '2026-01-01T00:00:00.000Z',
    endTime: '2026-01-02T00:00:00.000Z',
  };

  it('reads a page with the given options', async () => {
    const record = { recordType: 'Steps', count: 10 };
    mockNative.readRecords.mockResolvedValue(page([record]));
    const { result, unmount } = renderHook(
      () =>
        useReadRecords<StepsRecord>(STEPS, {
          timeRangeFilter: range,
          pageSize: 50,
        }),
      {}
    );
    await flush();
    expect(result.current.value?.records).toEqual([record]);
    expect(mockNative.readRecords).toHaveBeenCalledWith(
      STEPS,
      JSON.stringify({ pageSize: 50, timeRangeFilter: range })
    );
    unmount();
  });

  it('evaluates a range factory on every fetch without restarting on re-render', async () => {
    mockNative.readRecords.mockResolvedValue(page([]));
    let n = 0;
    const makeRange = () => {
      n += 1;
      return { startTime: `s${n}`, endTime: `e${n}` };
    };
    const { rerender, unmount } = renderHook(
      () => useReadRecords(STEPS, { timeRangeFilter: makeRange }),
      {}
    );
    await flush();
    rerender({});
    await flush();
    expect(mockNative.readRecords).toHaveBeenCalledTimes(1);

    act(() => appState.emit('active'));
    await flush();
    expect(mockNative.readRecords).toHaveBeenCalledTimes(2);
    expect(mockNative.readRecords).toHaveBeenLastCalledWith(
      STEPS,
      JSON.stringify({ timeRangeFilter: { startTime: 's2', endTime: 'e2' } })
    );
    unmount();
  });

  it('refetches when the record type changes and hides the old data', async () => {
    mockNative.readRecords.mockResolvedValueOnce(page([{ count: 1 }]));
    const { result, rerender, unmount } = renderHook(
      (type: RecordType) => useReadRecords(type),
      STEPS
    );
    await flush();
    expect(result.current.value?.records).toHaveLength(1);

    const pending = deferred<string>();
    mockNative.readRecords.mockReturnValueOnce(pending.promise);
    rerender(WEIGHT);
    expect(result.current.value).toBeUndefined();
    expect(result.current.loading).toBe(true);

    pending.resolve(page([]));
    await flush();
    expect(result.current.value?.records).toEqual([]);
    expect(mockNative.readRecords).toHaveBeenLastCalledWith(WEIGHT, '{}');
    unmount();
  });

  it('ignores a slow result for the previous arguments', async () => {
    const slow = deferred<string>();
    mockNative.readRecords.mockReturnValueOnce(slow.promise);
    const { result, rerender, unmount } = renderHook(
      (type: RecordType) => useReadRecords(type),
      STEPS
    );
    mockNative.readRecords.mockResolvedValueOnce(page([{ kg: 70 }]));
    rerender(WEIGHT);
    await flush();
    slow.resolve(page([{ count: 999 }]));
    await flush();
    expect(result.current.value?.records).toEqual([{ kg: 70 }]);
    unmount();
  });

  it('polls until ready, reporting satisfied', async () => {
    jest.useFakeTimers();
    mockNative.readRecords
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page([{ count: 5 }]));
    const { result, unmount } = renderHook(
      () =>
        useReadRecords(STEPS, {
          ready: (r) => r.records.length > 0,
          intervalMs: 100,
          timeoutMs: 1000,
        }),
      {}
    );
    await flush();
    expect(result.current.loading).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    await flush();
    expect(result.current.value?.records).toHaveLength(1);
    expect(result.current.satisfied).toBe(true);
    unmount();
    jest.useRealTimers();
  });
});

describe('useMostRecentRecord', () => {
  it('reads one record in descending order', async () => {
    const latest = { recordType: 'Weight', weight: { inKilograms: 70 } };
    mockNative.readRecords.mockResolvedValue(page([latest]));
    const { result, unmount } = renderHook(
      () => useMostRecentRecord(WEIGHT, { dataOriginFilter: ['com.x'] }),
      {}
    );
    await flush();
    expect(result.current.value).toEqual(latest);
    expect(mockNative.readRecords).toHaveBeenCalledWith(
      WEIGHT,
      JSON.stringify({
        dataOriginFilter: ['com.x'],
        ascendingOrder: false,
        pageSize: 1,
      })
    );
    unmount();
  });

  it('returns null when there is no record', async () => {
    mockNative.readRecords.mockResolvedValue(page([]));
    const { result, unmount } = renderHook(
      () =>
        useMostRecentRecord(WEIGHT, {
          timeRangeFilter: () => ({ startTime: 'a', endTime: 'b' }),
        }),
      {}
    );
    await flush();
    expect(result.current.value).toBeNull();
    expect(result.current.loading).toBe(false);
    unmount();
  });
});

describe('useAggregate', () => {
  const result0 = {
    recordType: 'Steps',
    dataOrigins: [],
    metrics: { COUNT_TOTAL: 1234 },
  };

  it('aggregates over a static range with an origin filter', async () => {
    mockNative.aggregateRecord.mockResolvedValue(JSON.stringify(result0));
    const range = { startTime: 'a', endTime: 'b' };
    const { result, unmount } = renderHook(
      () => useAggregate('Steps', range, { dataOriginFilter: ['com.fit'] }),
      {}
    );
    await flush();
    expect(result.current.value).toEqual(result0);
    expect(mockNative.aggregateRecord).toHaveBeenCalledWith(
      JSON.stringify({
        recordType: 'Steps',
        timeRangeFilter: range,
        dataOriginFilter: ['com.fit'],
      })
    );
    unmount();
  });

  it('accepts a range factory', async () => {
    mockNative.aggregateRecord.mockResolvedValue(JSON.stringify(result0));
    const { unmount } = renderHook(
      () => useAggregate('Steps', () => ({ startTime: 'x', endTime: 'y' })),
      {}
    );
    await flush();
    expect(mockNative.aggregateRecord).toHaveBeenCalledWith(
      JSON.stringify({
        recordType: 'Steps',
        timeRangeFilter: { startTime: 'x', endTime: 'y' },
      })
    );
    unmount();
  });
});

describe('useChanges', () => {
  const changesPage = (next: string, extra: object = {}) =>
    JSON.stringify({
      upsertionChanges: [],
      deletionChanges: [],
      nextChangesToken: next,
      hasMore: false,
      changesTokenExpired: false,
      ...extra,
    });

  it('pauses without a token', async () => {
    const { result, unmount } = renderHook(() => useChanges(null), {});
    await flush();
    expect(result.current.loading).toBe(false);
    expect(mockNative.getChanges).not.toHaveBeenCalled();
    unmount();
  });

  it('pulls from the token, then continues from nextChangesToken on resume', async () => {
    const onChanges = jest.fn();
    mockNative.getChanges
      .mockResolvedValueOnce(
        changesPage('t1', { deletionChanges: [{ recordId: 'r1' }] })
      )
      .mockResolvedValueOnce(changesPage('t2'));
    const { result, unmount } = renderHook(
      () => useChanges('t0', { onChanges, pageSize: 10 }),
      {}
    );
    await flush();
    expect(mockNative.getChanges).toHaveBeenLastCalledWith(
      't0',
      JSON.stringify({ pageSize: 10 })
    );
    expect(result.current.value?.deletionChanges).toEqual([{ recordId: 'r1' }]);
    expect(onChanges).toHaveBeenCalledTimes(1);

    act(() => appState.emit('active'));
    await flush();
    expect(mockNative.getChanges).toHaveBeenLastCalledWith(
      't1',
      JSON.stringify({ pageSize: 10 })
    );
    expect(result.current.value?.nextChangesToken).toBe('t2');
    expect(onChanges).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('keeps the token when it has expired and restarts from a new token prop', async () => {
    mockNative.getChanges.mockResolvedValueOnce(
      changesPage('ignored', { changesTokenExpired: true })
    );
    const { result, rerender, unmount } = renderHook(
      (token: string) => useChanges(token, { maxPages: 2 }),
      'old' as string
    );
    await flush();
    expect(result.current.value?.changesTokenExpired).toBe(true);

    mockNative.getChanges.mockResolvedValueOnce(changesPage('t1'));
    act(() => appState.emit('active'));
    await flush();
    expect(mockNative.getChanges).toHaveBeenLastCalledWith('old', '{}');

    mockNative.getChanges.mockResolvedValueOnce(changesPage('n1'));
    rerender('fresh');
    await flush();
    expect(mockNative.getChanges).toHaveBeenLastCalledWith('fresh', '{}');
    unmount();
  });

  it('does not call onChanges for a pull that finishes after unmount', async () => {
    const onChanges = jest.fn();
    const pending = deferred<string>();
    mockNative.getChanges.mockReturnValueOnce(pending.promise);
    const { unmount } = renderHook(() => useChanges('t0', { onChanges }), {});
    unmount();
    pending.resolve(changesPage('t1'));
    await flush();
    expect(onChanges).not.toHaveBeenCalled();
  });
});
