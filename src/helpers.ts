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

// ─── Time (Carbon-style fluent Instant) ───────────────────────────────────────

/**
 * Fluent Instant helper inspired by Laravel Carbon.
 *
 * @example
 * ```ts
 * now().toISOString()
 * now().subHours(1).toISOString()
 * now().subMinutes(30).toISOString()
 * now().subHours(1).until(now()) // { startTime, endTime }
 * ```
 */
export class HealthInstant {
  private constructor(private readonly date: Date) {}

  /** Clock at `at` (default wall clock). */
  static now(at: Date = new Date()): HealthInstant {
    return new HealthInstant(at);
  }

  /** Subtract whole hours (must be &gt; 0). */
  subHours(hours: number): HealthInstant {
    if (!(hours > 0)) {
      throw new Error('HealthInstant.subHours: hours must be > 0');
    }
    return new HealthInstant(new Date(this.date.getTime() - hours * 3600_000));
  }

  /** Subtract one hour. */
  subHour(): HealthInstant {
    return this.subHours(1);
  }

  /** Subtract whole minutes (must be &gt; 0). */
  subMinutes(minutes: number): HealthInstant {
    if (!(minutes > 0)) {
      throw new Error('HealthInstant.subMinutes: minutes must be > 0');
    }
    return new HealthInstant(new Date(this.date.getTime() - minutes * 60_000));
  }

  /** Subtract one minute. */
  subMinute(): HealthInstant {
    return this.subMinutes(1);
  }

  /** Subtract whole days (must be &gt; 0). */
  subDays(days: number): HealthInstant {
    if (!(days > 0)) {
      throw new Error('HealthInstant.subDays: days must be > 0');
    }
    return new HealthInstant(new Date(this.date.getTime() - days * 86400_000));
  }

  /** Subtract one day. */
  subDay(): HealthInstant {
    return this.subDays(1);
  }

  /** Add whole hours (must be &gt; 0). */
  addHours(hours: number): HealthInstant {
    if (!(hours > 0)) {
      throw new Error('HealthInstant.addHours: hours must be > 0');
    }
    return new HealthInstant(new Date(this.date.getTime() + hours * 3600_000));
  }

  /** Add one hour. */
  addHour(): HealthInstant {
    return this.addHours(1);
  }

  /** Add whole minutes (must be &gt; 0). */
  addMinutes(minutes: number): HealthInstant {
    if (!(minutes > 0)) {
      throw new Error('HealthInstant.addMinutes: minutes must be > 0');
    }
    return new HealthInstant(new Date(this.date.getTime() + minutes * 60_000));
  }

  /** Add one minute. */
  addMinute(): HealthInstant {
    return this.addMinutes(1);
  }

  /** Add whole days (must be &gt; 0). */
  addDays(days: number): HealthInstant {
    if (!(days > 0)) {
      throw new Error('HealthInstant.addDays: days must be > 0');
    }
    return new HealthInstant(new Date(this.date.getTime() + days * 86400_000));
  }

  /** Add one day. */
  addDay(): HealthInstant {
    return this.addDays(1);
  }

  /** ISO-8601 Instant string (Health Connect wire format). */
  toISOString(): string {
    return this.date.toISOString();
  }

  /** Underlying `Date` copy. */
  toDate(): Date {
    return new Date(this.date.getTime());
  }

  /**
   * Instant window from this Instant until `end` (default wall clock now).
   * Useful for writeRecords start/end without manual Date math.
   */
  until(end: HealthInstant | Date = HealthInstant.now()): TimeRangeFilter {
    const endDate = end instanceof HealthInstant ? end.toDate() : end;
    return {
      startTime: this.toISOString(),
      endTime: endDate.toISOString(),
    };
  }

  /** Same as {@link until} with `HealthInstant.now()`. */
  untilNow(): TimeRangeFilter {
    return this.until(HealthInstant.now());
  }
}

/** Carbon-style entry: `now().subHours(1).toISOString()`. */
export function now(at?: Date): HealthInstant {
  return HealthInstant.now(at);
}

/** ISO Instant string, `Date`, or fluent {@link HealthInstant}. */
export type InstantInput = string | Date | HealthInstant;

/** Normalize {@link InstantInput} to an ISO-8601 Instant string. */
export function toInstantISO(value: InstantInput): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof HealthInstant) {
    return value.toISOString();
  }
  return value.toISOString();
}

// ─── Time ranges ──────────────────────────────────────────────────────────────

/** Inclusive start / exclusive end Instant window ending at `end` (default now). */
export function timeRangeLastHours(
  hours: number,
  end: Date = new Date()
): TimeRangeFilter {
  return now(end).subHours(hours).until(end);
}

/** Inclusive start / exclusive end Instant window ending at `end` (default now). */
export function timeRangeLastDays(
  days: number,
  end: Date = new Date()
): TimeRangeFilter {
  return now(end).subDays(days).until(end);
}

/**
 * Local-calendar "today" from midnight to `now` (device local zone via Date).
 * Useful for steps / calories dashboards.
 */
export function timeRangeToday(at: Date = new Date()): TimeRangeFilter {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  return { startTime: start.toISOString(), endTime: at.toISOString() };
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

export class WaitTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaitTimeoutError';
  }
}

/** @deprecated Use {@link WaitTimeoutError}. */
export class WaitForRecordsTimeoutError extends WaitTimeoutError {
  constructor(message: string) {
    super(message);
    this.name = 'WaitForRecordsTimeoutError';
  }
}

export type PollUntilOptions<T> = {
  /** Stop when this returns true. */
  ready: (value: T) => boolean;
  /** Give up after this many ms. Default: 15000. */
  timeoutMs?: number;
  /** Poll interval. Default: 500. */
  intervalMs?: number;
  signal?: AbortSignal;
  /**
   * When true (default for {@link waitUntil}), throw {@link WaitTimeoutError}.
   * When false (recommended on AppState resume), return the last value with
   * `satisfied: false` so the UI can keep showing 0 / stale until the next open.
   */
  throwOnTimeout?: boolean;
};

export type PollUntilResult<T> = {
  value: T;
  /** True when `ready(value)` succeeded before timeout. */
  satisfied: boolean;
  attempts: number;
};

function abortError(signal?: AbortSignal): Error {
  // RN 0.88's AbortSignal typings expose `reason` as `any`; narrow to unknown.
  const reason: unknown =
    signal !== undefined && 'reason' in signal
      ? (signal as { reason?: unknown }).reason
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
 * Generic poller for Health Connect reads/aggregates.
 *
 * HC has **no push**. On real devices, the first read after resume is often
 * empty / `0` until Samsung Health / Fitbit / etc. finish writing into HC —
 * call this (or {@link waitForRecords}) when `AppState` becomes `active`.
 */
export async function pollUntil<T>(
  fetch: () => Promise<T>,
  options: PollUntilOptions<T>
): Promise<PollUntilResult<T>> {
  const {
    ready,
    timeoutMs = 15_000,
    intervalMs = 500,
    signal,
    throwOnTimeout = false,
  } = options;

  if (timeoutMs <= 0) {
    throw new Error('pollUntil: timeoutMs must be > 0');
  }
  if (intervalMs <= 0) {
    throw new Error('pollUntil: intervalMs must be > 0');
  }

  const started = Date.now();
  let attempts = 0;
  let last!: T;

  for (;;) {
    if (signal?.aborted === true) {
      throw abortError(signal);
    }

    last = await fetch();
    attempts += 1;
    if (ready(last)) {
      return { value: last, satisfied: true, attempts };
    }

    const elapsed = Date.now() - started;
    if (elapsed >= timeoutMs) {
      if (throwOnTimeout) {
        throw new WaitTimeoutError(
          `pollUntil timed out after ${timeoutMs}ms (${attempts} attempt(s))`
        );
      }
      return { value: last, satisfied: false, attempts };
    }

    await delay(Math.min(intervalMs, timeoutMs - elapsed), signal);
  }
}

/**
 * Like {@link pollUntil} but throws {@link WaitTimeoutError} on timeout.
 */
export async function waitUntil<T>(
  fetch: () => Promise<T>,
  options: Omit<PollUntilOptions<T>, 'throwOnTimeout'>
): Promise<T> {
  const result = await pollUntil(fetch, { ...options, throwOnTimeout: true });
  return result.value;
}

/**
 * Polls {@link readRecords} until records appear (or `predicate` / `minCount`
 * is satisfied), or until timeout. Prefer {@link pollUntil} + `aggregateRecord`
 * when the UI shows a total that starts at `0` after resume.
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

  const readOpts: ReadRecordsOptions = { timeRangeFilter };
  if (dataOriginFilter !== undefined) {
    readOpts.dataOriginFilter = dataOriginFilter;
  }

  const waitOpts: Omit<
    PollUntilOptions<ReadRecordsResponse<T>>,
    'throwOnTimeout'
  > = {
    ready: (page) =>
      predicate ? predicate(page.records) : page.records.length >= minCount,
    timeoutMs,
    intervalMs,
  };
  if (signal !== undefined) {
    waitOpts.signal = signal;
  }

  try {
    return await waitUntil(
      () => readRecords<T>(recordType, readOpts),
      waitOpts
    );
  } catch (e) {
    if (e instanceof WaitTimeoutError) {
      throw new WaitForRecordsTimeoutError(
        `waitForRecords timed out after ${timeoutMs}ms waiting for ${recordType}`
      );
    }
    throw e;
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
