'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * State that outlives a page. Pages here unmount when you move to another tab (Chat -> Globe -> Chat), so plain
 * useState loses the conversation. Values live at module level instead, which survives client-side navigation.
 * The setter also keeps working after the page has unmounted, so an answer that finishes while you are on
 * another tab is waiting when you come back.
 */
const store = new Map<string, unknown>();
const listeners = new Map<string, Set<(value: unknown) => void>>();

export function useSessionState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const read = (): T => {
    if (store.has(key)) return store.get(key) as T;
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  };
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const set = listeners.get(key) ?? new Set();
    const listener = (next: unknown) => setValue(next as T);
    set.add(listener);
    listeners.set(key, set);
    // Catch anything that changed between the first render and this effect.
    if (store.has(key)) setValue(store.get(key) as T);
    return () => {
      set.delete(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const prev = store.has(key) ? (store.get(key) as T) : read();
      const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
      store.set(key, next);
      listeners.get(key)?.forEach((l) => l(next));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, update];
}

/** Forget everything kept across pages (sign-out, switching account). */
export function resetSessionState(prefix = ''): void {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
