import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { pollUntil } from './helpers';
import type { PollUntilOptions, PollUntilResult } from './helpers';

export type PollOnForegroundOptions<T> = Omit<
  PollUntilOptions<T>,
  'signal' | 'throwOnTimeout'
> & {
  /** Called with the final value of each poll (satisfied or soft timeout). */
  onResult: (result: PollUntilResult<T>) => void;
  /** Called when `fetch` rejects. Aborted polls are never reported. */
  onError?: (error: unknown) => void;
  /** Called each time a new poll starts (e.g. to show a spinner). */
  onStart?: () => void;
  /** Poll once right away, not only on the next resume. Default: true. */
  runImmediately?: boolean;
};

export type ForegroundPoller = {
  /** Abort any in-flight poll and start a new one. */
  refresh: () => void;
  /** Abort any in-flight poll and stop listening to AppState. */
  stop: () => void;
};

/**
 * Polls whenever the app becomes `active` (and once immediately), aborting the
 * previous poll on background or re-entry so a stale result never overwrites
 * a newer one. Timeouts are soft: `onResult` gets the last value.
 */
export function pollOnForeground<T>(
  fetch: () => Promise<T>,
  options: PollOnForegroundOptions<T>
): ForegroundPoller {
  const {
    onResult,
    onError,
    onStart,
    runImmediately = true,
    ...pollOptions
  } = options;
  let controller: AbortController | undefined;
  let stopped = false;

  const abort = () => {
    controller?.abort();
    controller = undefined;
  };

  const refresh = () => {
    if (stopped) return;
    abort();
    const current = new AbortController();
    controller = current;
    onStart?.();
    pollUntil(fetch, {
      ...pollOptions,
      signal: current.signal,
      throwOnTimeout: false,
    }).then(
      (result) => {
        if (!current.signal.aborted) onResult(result);
      },
      (error: unknown) => {
        if (!current.signal.aborted) onError?.(error);
      }
    );
  };

  const subscription = AppState.addEventListener(
    'change',
    (state: AppStateStatus) => {
      if (state === 'active') refresh();
      else abort();
    }
  );

  if (runImmediately) refresh();

  return {
    refresh,
    stop: () => {
      stopped = true;
      abort();
      subscription.remove();
    },
  };
}

export type UseForegroundPollOptions<T> = Omit<
  PollOnForegroundOptions<T>,
  'onResult' | 'onError' | 'onStart'
> & {
  /** Set false to pause (e.g. until permissions are granted). Default: true. */
  enabled?: boolean;
};

export type UseForegroundPollState<T> = {
  /** Latest value, kept while a new poll is running. */
  value: T | undefined;
  /** False when the last poll timed out before `ready` — may be a real zero. */
  satisfied: boolean;
  /** True while a poll is in flight. */
  loading: boolean;
  error: unknown;
  refresh: () => void;
};

/**
 * React hook around {@link pollOnForeground}. `fetch` and `ready` may be
 * inline lambdas; only `enabled`, `timeoutMs` and `intervalMs` restart polling.
 */
export function useForegroundPoll<T>(
  fetch: () => Promise<T>,
  options: UseForegroundPollOptions<T>
): UseForegroundPollState<T> {
  const {
    enabled = true,
    ready,
    timeoutMs,
    intervalMs,
    runImmediately = true,
  } = options;
  const fetchRef = useRef(fetch);
  const readyRef = useRef(ready);
  fetchRef.current = fetch;
  readyRef.current = ready;

  const pollerRef = useRef<ForegroundPoller | undefined>(undefined);
  const [state, setState] = useState<
    Omit<UseForegroundPollState<T>, 'refresh'>
  >({
    value: undefined,
    satisfied: false,
    loading: enabled && runImmediately,
    error: undefined,
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const pollOptions: PollOnForegroundOptions<T> = {
      ready: (v) => readyRef.current(v),
      runImmediately,
      onStart: () =>
        setState((s) => ({ ...s, loading: true, error: undefined })),
      onResult: ({ value, satisfied }) =>
        setState({ value, satisfied, loading: false, error: undefined }),
      onError: (error) => setState((s) => ({ ...s, loading: false, error })),
    };
    if (timeoutMs !== undefined) pollOptions.timeoutMs = timeoutMs;
    if (intervalMs !== undefined) pollOptions.intervalMs = intervalMs;

    const poller = pollOnForeground(() => fetchRef.current(), pollOptions);
    pollerRef.current = poller;

    return () => {
      poller.stop();
      pollerRef.current = undefined;
    };
  }, [enabled, timeoutMs, intervalMs, runImmediately]);

  const refresh = useCallback(() => pollerRef.current?.refresh(), []);
  return { ...state, refresh };
}
