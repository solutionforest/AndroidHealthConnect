import {
  checkPermissions,
  getChanges,
  missingPermissions,
  readRecords,
  requestPermissions,
} from './index';
import type {
  DeletionChange,
  GetChangesOptions,
  GetChangesResponse,
  HealthPermission,
  HealthRecord,
  ReadRecordsOptions,
  ReadRecordsResponse,
  RecordType,
  TimeRangeFilter,
  UpsertionChange,
} from './types';

// ─── Permissions ──────────────────────────────────────────────────────────────

export type EnsurePermissionsResult = {
  granted: HealthPermission[];
  missing: HealthPermission[];
  allGranted: boolean;
};

/**
 * Ensures the listed permissions are granted. By default requests any that are
 * missing (shows the HC dialog). Pass `{ requestIfMissing: false }` to only check.
 */
export async function ensurePermissions(
  permissions: HealthPermission[],
  options: { requestIfMissing?: boolean } = {}
): Promise<EnsurePermissionsResult> {
  const { requestIfMissing = true } = options;
  if (permissions.length === 0) {
    return { granted: [], missing: [], allGranted: true };
  }

  let missing = await missingPermissions(permissions);
  if (missing.length > 0 && requestIfMissing) {
    await requestPermissions(permissions);
    missing = await missingPermissions(permissions);
  }

  const granted = await checkPermissions(permissions);
  return {
    granted,
    missing,
    allGranted: missing.length === 0,
  };
}

// ─── Time ranges ──────────────────────────────────────────────────────────────

/** Inclusive start / exclusive end Instant window ending at `end` (default now). */
export function timeRangeLastHours(
  hours: number,
  end: Date = new Date()
): TimeRangeFilter {
  if (!(hours > 0)) {
    throw new Error('timeRangeLastHours: hours must be > 0');
  }
  const start = new Date(end.getTime() - hours * 3600_000);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

/** Inclusive start / exclusive end Instant window ending at `end` (default now). */
export function timeRangeLastDays(
  days: number,
  end: Date = new Date()
): TimeRangeFilter {
  if (!(days > 0)) {
    throw new Error('timeRangeLastDays: days must be > 0');
  }
  const start = new Date(end.getTime() - days * 86400_000);
  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

/**
 * Local-calendar "today" from midnight to `now` (device local zone via Date).
 * Useful for steps / calories dashboards.
 */
export function timeRangeToday(now: Date = new Date()): TimeRangeFilter {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return { startTime: start.toISOString(), endTime: now.toISOString() };
}

// ─── Wait / poll ──────────────────────────────────────────────────────────────

export type WaitForRecordsOptions<T extends HealthRecord> = {
  recordType: RecordType;
  timeRangeFilter: TimeRangeFilter;
  dataOriginFilter?: string[];
  /** Stop when at least this many records exist. Default: 1. Ignored if `predicate` is set. */
  minCount?: number;
  /** Custom stop condition (receives the latest page of records). */
  predicate?: (records: T[]) => boolean;
  /** Give up after this many ms. Default: 15000. */
  timeoutMs?: number;
  /** Poll interval. Default: 500. */
  intervalMs?: number;
  signal?: AbortSignal;
};

export class WaitForRecordsTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaitForRecordsTimeoutError';
  }
}

function abortError(signal?: AbortSignal): Error {
  const reason =
    signal !== undefined && 'reason' in signal
      ? (signal as AbortSignal & { reason?: unknown }).reason
      : undefined;
  return reason instanceof Error ? reason : new Error('Aborted');
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(abortError(signal));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError(signal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Polls {@link readRecords} until records appear (or `predicate` / `minCount`
 * is satisfied), or until timeout. Health Connect has no push observer — use
 * this after a write, or while waiting for a wearable sync while the app is
 * foregrounded.
 *
 * @throws {WaitForRecordsTimeoutError} when `timeoutMs` elapses
 */
export async function waitForRecords<T extends HealthRecord>(
  options: WaitForRecordsOptions<T>
): Promise<ReadRecordsResponse<T>> {
  const {
    recordType,
    timeRangeFilter,
    dataOriginFilter,
    minCount = 1,
    predicate,
    timeoutMs = 15_000,
    intervalMs = 500,
    signal,
  } = options;

  if (timeoutMs <= 0) {
    throw new Error('waitForRecords: timeoutMs must be > 0');
  }
  if (intervalMs <= 0) {
    throw new Error('waitForRecords: intervalMs must be > 0');
  }

  const started = Date.now();
  const ready = (records: T[]) =>
    predicate ? predicate(records) : records.length >= minCount;

  for (;;) {
    if (signal?.aborted === true) {
      throw abortError(signal);
    }

    const readOpts: ReadRecordsOptions = { timeRangeFilter };
    if (dataOriginFilter !== undefined) {
      readOpts.dataOriginFilter = dataOriginFilter;
    }
    const page = await readRecords<T>(recordType, readOpts);
    if (ready(page.records)) {
      return page;
    }

    const elapsed = Date.now() - started;
    if (elapsed >= timeoutMs) {
      throw new WaitForRecordsTimeoutError(
        `waitForRecords timed out after ${timeoutMs}ms waiting for ${recordType}`
      );
    }

    const sleep = Math.min(intervalMs, timeoutMs - elapsed);
    await delay(sleep, signal);
  }
}

// ─── Pagination / changelog ───────────────────────────────────────────────────

/**
 * Follows `pageToken` until exhausted (or `maxPages`). Returns a flat record list.
 */
export async function readAllRecords<T extends HealthRecord>(
  recordType: RecordType,
  options: ReadRecordsOptions = {},
  paging: { maxPages?: number } = {}
): Promise<T[]> {
  const maxPages = paging.maxPages ?? 50;
  const all: T[] = [];
  let pageToken: string | null | undefined = options.pageToken;

  for (let page = 0; page < maxPages; page++) {
    const res: ReadRecordsResponse<T> = await readRecords<T>(recordType, {
      ...options,
      ...(typeof pageToken === 'string' && pageToken.length > 0
        ? { pageToken }
        : {}),
    });
    all.push(...res.records);
    const next = res.pageToken;
    if (typeof next !== 'string' || next.length === 0) {
      return all;
    }
    pageToken = next;
  }

  return all;
}

export type PullChangesResult = {
  upsertionChanges: UpsertionChange[];
  deletionChanges: DeletionChange[];
  nextChangesToken: string;
  changesTokenExpired: boolean;
  pagesFetched: number;
};

/**
 * Drains the changelog: loops {@link getChanges} while `hasMore`.
 * Returns merged upserts/deletes and the token to persist.
 *
 * If `changesTokenExpired` is true, stop and backfill with {@link readRecords}
 * before minting a fresh token via {@link getChangesToken}.
 */
export async function pullChanges(
  changesToken: string,
  options: GetChangesOptions & { maxPages?: number } = {}
): Promise<PullChangesResult> {
  const { maxPages = 100, ...changeOpts } = options;
  const upsertionChanges: UpsertionChange[] = [];
  const deletionChanges: DeletionChange[] = [];

  let token = changesToken;
  let pagesFetched = 0;
  let last: GetChangesResponse | null = null;

  while (pagesFetched < maxPages) {
    const page = await getChanges(token, changeOpts);
    pagesFetched += 1;
    last = page;
    upsertionChanges.push(...page.upsertionChanges);
    deletionChanges.push(...page.deletionChanges);
    token = page.nextChangesToken;

    if (page.changesTokenExpired || !page.hasMore) {
      break;
    }
  }

  if (!last) {
    throw new Error('pullChanges: no pages fetched');
  }

  return {
    upsertionChanges,
    deletionChanges,
    nextChangesToken: last.nextChangesToken,
    changesTokenExpired: last.changesTokenExpired,
    pagesFetched,
  };
}
