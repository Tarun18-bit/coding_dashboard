'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Problems a user ticked by hand ("Mark Done"), kept in this browser's localStorage and shared by
 * the roadmap sheets and the daily workout. Synced solves come from the server; these only fill gaps.
 */
const STORAGE_KEY = 'dashcode_manual_sheet_solves_v1';
const CHANGE_EVENT = 'dashcode:manual-solves';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function parse(raw: string): Record<string, boolean> {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === 'object' ? (value as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useManualSolves(): [Record<string, boolean>, (problemId: string, currentlySolved: boolean) => void] {
  // Server render (and the first client render) see no overrides, so hydration always matches
  const raw = useSyncExternalStore(subscribe, readRaw, () => '');
  const overrides = useMemo(() => parse(raw), [raw]);

  const toggle = useCallback((problemId: string, currentlySolved: boolean) => {
    const next = { ...parse(readRaw()), [problemId]: !currentlySolved };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // storage unavailable (private mode): nothing to persist
    }
  }, []);

  return [overrides, toggle];
}
