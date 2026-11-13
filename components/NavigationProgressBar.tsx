'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Complete loading when pathname or searchParams change
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
        document.body.style.cursor = '';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept internal link clicks for 0ms instant feedback
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isExternal =
        target.getAttribute('target') === '_blank' ||
        target.getAttribute('rel')?.includes('external') ||
        (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.startsWith(window.location.origin));

      const isDownload = target.hasAttribute('download');
      const isSamePageHash = href?.startsWith('#');

      if (!href || isExternal || isDownload || isSamePageHash) return;

      // Check if clicking same path without query changes
      try {
        const targetUrl = new URL(href, window.location.origin);
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search &&
          targetUrl.hash === window.location.hash
        ) {
          return;
        }
      } catch {
        return;
      }

      // Trigger instant navigation feedback
      setLoading(true);
      setProgress(30);
      document.body.style.cursor = 'wait';
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.body.style.cursor = '';
    };
  }, []);

  // Increment progress incrementally while waiting
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev;
        const remaining = 85 - prev;
        return prev + Math.max(1, Math.floor(remaining * 0.15));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [loading]);

  if (!loading && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none transition-all duration-200"
      style={{
        opacity: loading || progress < 100 ? 1 : 0,
      }}
    >
      <div
        className="h-full bg-[#2563EB] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '150ms' : '200ms',
        }}
      />
    </div>
  );
}