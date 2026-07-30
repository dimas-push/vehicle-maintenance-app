import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

/**
 * Wraps a memoized `load` callback and exposes {data, loading, error, reload}.
 * Fixes a real bug in the old useFocusEffect(() => load().then(setX)) pattern:
 * that had no loading state, so a screen's empty-state could flash before
 * real data arrived on every focus. Always pair with useFocusRefresh(reload)
 * below — this hook does not fetch on its own; useFocusEffect already runs
 * on initial mount for a screen that's focused, so a separate mount effect
 * here would just be a second, redundant trigger for the same fetch.
 */
export function useAsyncData<T>(load: () => Promise<T>): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [load]);

  return { data, loading, error, reload };
}

/** Re-runs `reload` every time the screen regains focus — the useFocusEffect wrapper every screen needs. */
export function useFocusRefresh(reload: () => void | Promise<void>): void {
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );
}
