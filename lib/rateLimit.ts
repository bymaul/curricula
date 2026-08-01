const WINDOW_MS = 60_000;
const WINDOW_MAX = 10;
const DAY_MS = 86_400_000;
const DAY_MAX = 100;

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();
const days = new Map<string, WindowState>();

function prune(map: Map<string, WindowState>, now: number) {
  for (const [key, state] of map) {
    if (now >= state.resetAt) map.delete(key);
  }
}

export function clientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export function rateLimitStatus(ip: string): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  prune(windows, now);
  prune(days, now);

  const window = windows.get(ip);
  const day = days.get(ip);

  if (day && day.count >= DAY_MAX) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((day.resetAt - now) / 1000),
    };
  }

  if (window && window.count >= WINDOW_MAX) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000),
    };
  }

  if (window) {
    window.count += 1;
  } else {
    windows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  if (day) {
    day.count += 1;
  } else {
    days.set(ip, { count: 1, resetAt: now + DAY_MS });
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error:
        'Rate limit exceeded for this free API key. Please wait a moment and try again.',
    }),
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}
