import { useCallback, useEffect, useRef, useState } from 'react';
import {
  aggregateRecord,
  checkPermissions,
  isHealthConnectAvailable,
  readRecords,
  requestPermissions,
} from './index';
import { pullChanges } from './helpers';
import type { EnsurePermissionsResult, PullChangesResult } from './helpers';
import { pollOnForeground } from './foreground';
import type {
  ForegroundPoller,
  PollOnForegroundOptions,
  UseForegroundPollState,
} from './foreground';
import type {
  AggregateRecordType,
  AggregateRequest,
  AggregateResult,
  GetChangesOptions,
  HealthConnectAvailability,
  HealthPermission,
  HealthRecord,
  ReadRecordsOptions,
  ReadRecordsResponse,
  RecordType,
  TimeRangeFilter,
} from './types';

// ─── Shared query plumbing ────────────────────────────────────────────────────

/**
 * A time range, or a function that builds one. Pass a function (for example
 * `() => timeRangeToday()`) when the range is relative to "now": it is
 * re-evaluated on every fetch, including each foreground resume, and does not
 * restart the query on re-render.
 */
export type TimeRangeInput = TimeRangeFilter | (() => TimeRangeFilter);

/** Options shared by every data hook. */
export type HealthQueryOptions<T> = {
  /** Set false to pause (e.g. until permissions are granted). Default: true. */
  enabled?: boolean;
  /**
   * Keep polling until this returns true, e.g. `(r) => r.records.length > 0`
   * to wait out the "0 right after resume" sync gap. Default: accept the first
   * result (one read per mount / resume / refresh).
   */
  ready?: (value: T) => boolean;
  /** Poll timeout when `ready` is set. Default: 15000. */
  timeoutMs?: number;
  /** Poll interval when `ready` is set. Default: 500. */
  intervalMs?: number;
};

/**
 * State returned by the data hooks. Same shape as {@link useForegroundPoll}:
 * `value` is `undefined` until the first result for the current arguments.
 */
export type HealthQueryState<T> = UseForegroundPollState<T>;

const acceptFirst = () => true;

function resolveTimeRange(range: TimeRangeInput): TimeRangeFilter {
  return typeof range === 'function' ? range() : range;
}

type InternalState<T> = Omit<HealthQueryState<T>, 'refresh'> & {
  key: string;
};

/**
 * Runs `fetch` on mount, on every foreground resume and whenever `key`
 * changes. Results for an older key, or after unmount, are dropped.
 */
function useHealthQuery<T>(
  key: string,
  fetch: () => Promise<T>,
  options: HealthQueryOptions<T> & { onResult?: (value: T) => void }
): HealthQueryState<T> {
  const { enabled = true, ready, timeoutMs, intervalMs, onResult } = options;
  const fetchRef = useRef(fetch);
  const readyRef = useRef(ready);
  const onResultRef = useRef(onResult);
  fetchRef.current = fetch;
  readyRef.current = ready;
  onResultRef.current = onResult;

  const pollerRef = useRef<ForegroundPoller | undefined>(undefined);
  const [state, setState] = useState<InternalState<T>>({
    key,
    value: undefined,
    satisfied: false,
    loading: enabled,
    error: undefined,
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const pollOptions: PollOnForegroundOptions<T> = {
      ready: (v) => (readyRef.current ?? acceptFirst)(v),
      onStart: () =>
        setState((s) => ({
          ...(s.key === key
            ? s
            : { key, value: undefined, satisfied: false, error: undefined }),
          loading: true,
          error: undefined,
        })),
      onResult: ({ value, satisfied }) => {
        setState({ key, value, satisfied, loading: false, error: undefined });
        onResultRef.current?.(value);
      },
      onError: (error) =>
        setState((s) => ({
          ...(s.key === key ? s : { key, value: undefined, satisfied: false }),
          loading: false,
          error,
        })),
    };
    if (timeoutMs !== undefined) pollOptions.timeoutMs = timeoutMs;
    if (intervalMs !== undefined) pollOptions.intervalMs = intervalMs;

    const poller = pollOnForeground(() => fetchRef.current(), pollOptions);
    pollerRef.current = poller;

    return () => {
      poller.stop();
      pollerRef.current = undefined;
    };
  }, [enabled, key, timeoutMs, intervalMs]);

  const refresh = useCallback(() => pollerRef.current?.refresh(), []);

  // Before the effect for a new key has run, don't show the old key's data.
  if (state.key !== key) {
    return {
      value: undefined,
      satisfied: false,
      loading: enabled,
      error: undefined,
      refresh,
    };
  }
  return {
    value: state.value,
    satisfied: state.satisfied,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Health Connect availability (`'available'`, `'notInstalled'`,
 * `'notSupported'`). Re-checked on every resume, so the value updates after
 * the user installs Health Connect from the Play Store and comes back.
 */
export function useHealthConnectAvailability(
  options: Pick<HealthQueryOptions<HealthConnectAvailability>, 'enabled'> = {}
): HealthQueryState<HealthConnectAvailability> {
  return useHealthQuery('availability', isHealthConnectAvailable, options);
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export type HealthConnectPermissionsStatus =
  HealthQueryState<EnsurePermissionsResult>;

/** Opens the HC permission dialog for missing permissions; resolves with the re-checked status. */
export type RequestHealthConnectPermissions =
  () => Promise<EnsurePermissionsResult>;

async function permissionStatus(
  permissions: HealthPermission[]
): Promise<EnsurePermissionsResult> {
  if (permissions.length === 0) {
    return { granted: [], missing: [], allGranted: true };
  }
  const granted = await checkPermissions(permissions);
  const grantedSet = new Set(granted);
  const missing = permissions.filter((p) => !grantedSet.has(p));
  return { granted, missing, allGranted: missing.length === 0 };
}

/**
 * Granted / missing state for `permissions`, plus a `request` function that
 * shows the Health Connect dialog for the missing ones. The status is
 * re-checked on every resume (the user may revoke access in Settings).
 *
 * @example
 * ```tsx
 * const [status, request] = useHealthConnectPermissions([
 *   'android.permission.health.READ_STEPS',
 * ]);
 * if (!status.value?.allGranted) return <Button title="Allow" onPress={() => void request()} />;
 * ```
 */
export function useHealthConnectPermissions(
  permissions: HealthPermission[],
  options: Pick<HealthQueryOptions<EnsurePermissionsResult>, 'enabled'> = {}
): [HealthConnectPermissionsStatus, RequestHealthConnectPermissions] {
  const key = JSON.stringify(permissions);
  const permissionsRef = useRef(permissions);
  permissionsRef.current = permissions;

  const status = useHealthQuery(
    key,
    () => permissionStatus(permissionsRef.current),
    options
  );
  const { refresh } = status;

  const request = useCallback(async () => {
    const perms = permissionsRef.current;
    const before = await permissionStatus(perms);
    if (before.missing.length > 0) {
      await requestPermissions(before.missing);
    }
    const after = await permissionStatus(perms);
    refresh();
    return after;
  }, [refresh]);

  return [status, request];
}

// ─── Records ──────────────────────────────────────────────────────────────────

export type UseReadRecordsOptions<T> = Omit<
  ReadRecordsOptions,
  'timeRangeFilter'
> &
  HealthQueryOptions<ReadRecordsResponse<T>> & {
    /** Defaults to the last 30 days (native default) when omitted. */
    timeRangeFilter?: TimeRangeInput;
  };

function splitReadOptions<Q>(
  options: Omit<ReadRecordsOptions, 'timeRangeFilter'> &
    HealthQueryOptions<Q> & { timeRangeFilter?: TimeRangeInput }
): {
  read: Omit<ReadRecordsOptions, 'timeRangeFilter'>;
  range: TimeRangeInput | undefined;
  query: HealthQueryOptions<Q>;
} {
  const { enabled, ready, timeoutMs, intervalMs, timeRangeFilter, ...read } =
    options;
  const query: HealthQueryOptions<Q> = {};
  if (enabled !== undefined) query.enabled = enabled;
  if (ready !== undefined) query.ready = ready;
  if (timeoutMs !== undefined) query.timeoutMs = timeoutMs;
  if (intervalMs !== undefined) query.intervalMs = intervalMs;
  return { read, range: timeRangeFilter, query };
}

function buildReadOptions(
  read: Omit<ReadRecordsOptions, 'timeRangeFilter'>,
  range: TimeRangeInput | undefined
): ReadRecordsOptions {
  return range === undefined
    ? { ...read }
    : { ...read, timeRangeFilter: resolveTimeRange(range) };
}

/**
 * One page of records of `recordType`. Refetches on resume and when the
 * arguments change (compared by value, so inline objects are fine).
 *
 * @example
 * ```tsx
 * const { value, loading } = useReadRecords<StepsRecord>(RecordType.STEPS, {
 *   timeRangeFilter: () => timeRangeLastDays(7),
 * });
 * ```
 */
export function useReadRecords<T extends HealthRecord = HealthRecord>(
  recordType: RecordType,
  options: UseReadRecordsOptions<T> = {}
): HealthQueryState<ReadRecordsResponse<T>> {
  const { read, range, query } = splitReadOptions(options);
  // Functions are dropped by JSON.stringify, so a range factory never changes the key.
  const key = JSON.stringify([recordType, read, range]);
  return useHealthQuery(
    key,
    () => readRecords<T>(recordType, buildReadOptions(read, range)),
    query
  );
}

export type UseMostRecentRecordOptions<T> = Pick<
  ReadRecordsOptions,
  'dataOriginFilter'
> &
  HealthQueryOptions<T | null> & {
    /** Window to search. Defaults to the last 30 days (native default). */
    timeRangeFilter?: TimeRangeInput;
  };

/**
 * The newest record of `recordType` in the window, or `null` when there is
 * none. Reads one record in descending order.
 *
 * @example
 * ```tsx
 * const { value: weight } = useMostRecentRecord<WeightRecord>(RecordType.WEIGHT);
 * ```
 */
export function useMostRecentRecord<T extends HealthRecord = HealthRecord>(
  recordType: RecordType,
  options: UseMostRecentRecordOptions<T> = {}
): HealthQueryState<T | null> {
  const { read, range, query } = splitReadOptions(options);
  const key = JSON.stringify(['mostRecent', recordType, read, range]);
  return useHealthQuery(
    key,
    async () => {
      const page = await readRecords<T>(recordType, {
        ...buildReadOptions(read, range),
        ascendingOrder: false,
        pageSize: 1,
      });
      return page.records[0] ?? null;
    },
    query
  );
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

export type UseAggregateOptions = Pick<AggregateRequest, 'dataOriginFilter'> &
  HealthQueryOptions<AggregateResult>;

/**
 * Aggregated metrics (`COUNT_TOTAL`, `BPM_AVG`, …) for `recordType` over
 * `timeRange`. Pass a function such as `() => timeRangeToday()` so "today"
 * moves forward on each resume.
 *
 * @example
 * ```tsx
 * const { value, satisfied } = useAggregate(RecordType.STEPS, () => timeRangeToday(), {
 *   ready: (r) => ((r.metrics['COUNT_TOTAL'] as number | null) ?? 0) > 0,
 * });
 * ```
 */
export function useAggregate(
  recordType: AggregateRecordType,
  timeRange: TimeRangeInput,
  options: UseAggregateOptions = {}
): HealthQueryState<AggregateResult> {
  const { dataOriginFilter, ...query } = options;
  const key = JSON.stringify([recordType, timeRange, dataOriginFilter]);
  return useHealthQuery(
    key,
    () => {
      const request: AggregateRequest = {
        recordType,
        timeRangeFilter: resolveTimeRange(timeRange),
      };
      if (dataOriginFilter !== undefined) {
        request.dataOriginFilter = dataOriginFilter;
      }
      return aggregateRecord(request);
    },
    query
  );
}

// ─── Changelog ────────────────────────────────────────────────────────────────

export type UseChangesOptions = GetChangesOptions &
  Pick<HealthQueryOptions<PullChangesResult>, 'enabled'> & {
    /** Max changelog pages per pull. Default: 100. */
    maxPages?: number;
    /**
     * Called once per successful pull with the drained changes. Apply them and
     * persist `result.nextChangesToken` here; the hook already continues from
     * that token on the next resume.
     */
    onChanges?: (result: PullChangesResult) => void;
  };

/**
 * Changelog sync built on {@link pullChanges}. Pulls on mount and on every
 * resume, starting from `token` and then from each `nextChangesToken`.
 * Pass `null` / `undefined` to pause (e.g. before you have minted a token).
 * When `value.changesTokenExpired` is true, backfill with `readRecords`, mint
 * a new token with `getChangesToken` and pass it in.
 */
export function useChanges(
  token: string | null | undefined,
  options: UseChangesOptions = {}
): HealthQueryState<PullChangesResult> {
  const { enabled = true, onChanges, maxPages, ...changeOptions } = options;
  // Tracks the token to pull from next; reset when the caller passes a new one.
  const cursorRef = useRef({ start: token, current: token });
  if (cursorRef.current.start !== token) {
    cursorRef.current = { start: token, current: token };
  }

  const pullOptions: GetChangesOptions & { maxPages?: number } = {
    ...changeOptions,
  };
  if (maxPages !== undefined) pullOptions.maxPages = maxPages;

  const key = JSON.stringify([token, pullOptions]);
  const hasToken = typeof token === 'string' && token.length > 0;

  return useHealthQuery(
    key,
    () => pullChanges(cursorRef.current.current as string, pullOptions),
    {
      enabled: enabled && hasToken,
      onResult: (result) => {
        if (!result.changesTokenExpired) {
          cursorRef.current.current = result.nextChangesToken;
        }
        onChanges?.(result);
      },
    }
  );
}
