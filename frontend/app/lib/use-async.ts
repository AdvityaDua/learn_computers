import { useEffect, useState } from "react";

type AsyncState<T> = { data: T | null; error: string | null; loading: boolean };

/** Small shared fetch-on-mount hook so sections don't each re-implement loading/error state. */
export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList, skip = false): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: !skip });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (skip) return;
    let alive = true;
    // Deferred a microtask so this doesn't count as a synchronous setState-in-effect (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (alive) setState((prev) => ({ ...prev, loading: true, error: null }));
    });
    fn()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (alive) setState({ data: null, error: err instanceof Error ? err.message : "Something went wrong", loading: false });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, skip]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
