'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Renders a date/time in the visitor's own timezone and locale.
 * The server renders a neutral UTC value and the browser swaps in the local one after
 * hydration, which avoids React hydration mismatches (server is UTC, visitor is not).
 */
export function LocalTime({ iso, mode = 'date' }: { iso: string; mode?: 'date' | 'time' | 'datetime' }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  let text: string;
  if (!isClient) {
    const utc = d.toISOString();
    text = mode === 'time' ? `${utc.slice(11, 16)} UTC` : mode === 'date' ? utc.slice(0, 10) : `${utc.slice(0, 10)} ${utc.slice(11, 16)} UTC`;
  } else if (mode === 'time') {
    text = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (mode === 'date') {
    text = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } else {
    text = d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  return <time dateTime={d.toISOString()}>{text}</time>;
}
