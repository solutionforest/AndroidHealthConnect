import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { AppState } from 'react-native';
import { pollOnForeground, useForegroundPoll } from '../foreground';
import type {
  UseForegroundPollOptions,
  UseForegroundPollState,
} from '../foreground';

jest.mock(
  'react-native',
  () => {
    const listeners = new Set<Function>();
    return {
      TurboModuleRegistry: { getEnforcing: () => ({}) },
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

const appState = AppState as unknown as {
  emit: (state: string) => void;
  listenerCount: () => number;
};

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

/** Resolves on demand so tests control when each poll attempt finishes. */
function deferredFetch<T>() {
  const pending: Array<(v: T) => void> = [];
  const fetch = jest.fn(
    () => new Promise<T>((resolve) => pending.push(resolve))
  );
  return { fetch, resolveNext: (v: T) => pending.shift()?.(v) };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  expect(appState.listenerCount()).toBe(0);
});

describe('pollOnForeground', () => {
  it('polls immediately and again on resume', async () => {
    const fetch = jest.fn().mockResolvedValue(5);
    const onResult = jest.fn();
    const onStart = jest.fn();
    const poller = pollOnForeground(fetch, {
      ready: (n: number) => n > 0,
      onResult,
      onStart,
    });

    await flush();
    expect(onResult).toHaveBeenLastCalledWith({
      value: 5,
      satisfied: true,
      attempts: 1,
    });

    appState.emit('active');
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onStart).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  it('keeps polling while 0, then reports the synced value', async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValue(1234);
    const onResult = jest.fn();
    const poller = pollOnForeground(fetch, {
      ready: (n: number) => n > 0,
      intervalMs: 100,
      onResult,
    });

    await flush();
    await jest.advanceTimersByTimeAsync(100);
    expect(onResult).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(100);
    expect(onResult).toHaveBeenCalledWith({
      value: 1234,
      satisfied: true,
      attempts: 3,
    });
    poller.stop();
  });

  it('soft-times out with the last value', async () => {
    const onResult = jest.fn();
    const poller = pollOnForeground(jest.fn().mockResolvedValue(0), {
      ready: (n: number) => n > 0,
      timeoutMs: 250,
      intervalMs: 100,
      onResult,
    });

    await jest.advanceTimersByTimeAsync(300);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ value: 0, satisfied: false })
    );
    poller.stop();
  });

  it('drops a stale poll when the app re-enters before it finishes', async () => {
    const { fetch, resolveNext } = deferredFetch<number>();
    const onResult = jest.fn();
    const poller = pollOnForeground(fetch, {
      ready: () => true,
      onResult,
    });

    appState.emit('background');
    appState.emit('active');
    resolveNext(1); // stale first poll
    resolveNext(2);
    await flush();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ value: 2 })
    );
    poller.stop();
  });

  it('reports fetch errors but not aborts', async () => {
    const onError = jest.fn();
    const onResult = jest.fn();
    const poller = pollOnForeground(
      jest.fn().mockRejectedValue(new Error('SecurityException')),
      { ready: () => true, onResult, onError }
    );
    await flush();
    expect(onError).toHaveBeenCalledWith(new Error('SecurityException'));

    const { fetch } = deferredFetch<number>();
    const silent = jest.fn();
    const p2 = pollOnForeground(fetch, {
      ready: () => true,
      onResult,
      onError: silent,
    });
    p2.stop();
    await flush();
    expect(silent).not.toHaveBeenCalled();
    poller.stop();
  });

  it('respects runImmediately: false and ignores refresh after stop', async () => {
    const fetch = jest.fn().mockResolvedValue(1);
    const poller = pollOnForeground(fetch, {
      ready: () => true,
      onResult: jest.fn(),
      runImmediately: false,
    });
    expect(fetch).not.toHaveBeenCalled();
    poller.refresh();
    expect(fetch).toHaveBeenCalledTimes(1);
    poller.stop();
    poller.refresh();
    appState.emit('active');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('useForegroundPoll', () => {
  function renderHook<T>(
    fetch: () => Promise<T>,
    options: UseForegroundPollOptions<T>
  ) {
    const result: { current: UseForegroundPollState<T> | undefined } = {
      current: undefined,
    };
    function Probe(props: { opts: UseForegroundPollOptions<T> }) {
      result.current = useForegroundPoll(fetch, props.opts);
      return null;
    }
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(<Probe opts={options} />);
    });
    return {
      result,
      rerender: (opts: UseForegroundPollOptions<T>) =>
        act(() => renderer.update(<Probe opts={opts} />)),
      unmount: () => act(() => renderer.unmount()),
    };
  }

  it('exposes loading, value and satisfied across resume', async () => {
    let steps = 42;
    const fetch = jest.fn(() => Promise.resolve(steps));
    const { result, unmount } = renderHook(fetch, {
      ready: (n) => n > 0,
      timeoutMs: 50,
      intervalMs: 10,
    });
    expect(result.current?.loading).toBe(true);
    expect(result.current?.value).toBeUndefined();

    await act(flush);
    expect(result.current).toMatchObject({
      value: 42,
      satisfied: true,
      loading: false,
    });

    steps = 0;
    act(() => appState.emit('active'));
    expect(result.current).toMatchObject({ value: 42, loading: true });

    await act(() => jest.advanceTimersByTimeAsync(60));
    expect(result.current).toMatchObject({
      value: 0,
      satisfied: false,
      loading: false,
    });
    unmount();
  });

  it('waits while disabled, surfaces errors, and supports refresh', async () => {
    const fetch = jest
      .fn<Promise<number>, []>()
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValue(7);
    const { result, rerender, unmount } = renderHook(fetch, {
      ready: () => true,
      enabled: false,
    });
    expect(result.current?.loading).toBe(false);
    act(() => result.current?.refresh());
    expect(fetch).not.toHaveBeenCalled();

    rerender({ ready: () => true });
    await act(flush);
    expect(result.current?.error).toEqual(new Error('denied'));

    await act(async () => {
      result.current?.refresh();
      await flush();
    });
    expect(result.current).toMatchObject({ value: 7, error: undefined });
    unmount();
  });
});
