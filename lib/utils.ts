import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TranslationKey } from '@/lib/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type RelativeTimeKey = 'justNow' | 'seconds' | 'minutes' | 'hours' | 'days';

export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now(),
  t?: (key: TranslationKey, params?: Record<string, string | number>) => string,
) {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  let key: RelativeTimeKey;
  let value: number;
  if (seconds < 5) {
    key = 'justNow';
    value = 0;
  } else if (seconds < 60) {
    key = 'seconds';
    value = seconds;
  } else if (seconds < 3600) {
    key = 'minutes';
    value = Math.floor(seconds / 60);
  } else if (seconds < 86400) {
    key = 'hours';
    value = Math.floor(seconds / 3600);
  } else {
    key = 'days';
    value = Math.floor(seconds / 86400);
  }

  if (!t) {
    const map: Record<RelativeTimeKey, string> = {
      justNow: 'just now',
      seconds: `${value}s ago`,
      minutes: `${value}m ago`,
      hours: `${value}h ago`,
      days: `${value}d ago`,
    };
    return map[key];
  }

  switch (key) {
    case 'justNow':
      return t('common.time.justNow');
    case 'seconds':
      return t('common.time.secondsAgo', { s: value });
    case 'minutes':
      return t('common.time.minutesAgo', { m: value });
    case 'hours':
      return t('common.time.hoursAgo', { h: value });
    case 'days':
      return t('common.time.daysAgo', { d: value });
  }
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function safeParseJSON(text: string): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function clampScale(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
