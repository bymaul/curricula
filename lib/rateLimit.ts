const WINDOW_MS = 60_000;
const WINDOW_MAX = 10;
const DAY_MS = 86_400_000;
const DAY_MAX = 100;

// Per-key limits are more generous than per-IP: the bundled key is shared by
// every user of a deployment, so a tight per-key cap would throttle legit
// traffic. The point of the per-key cap is to bound how much a single leaked
// or bundled key can burn in a day.
const KEY_WINDOW_MAX = 30;
const KEY_DAY_MAX = 500;

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();
const days = new Map<string, WindowState>();

// Trusted proxy headers first: `cf-connecting-ip` (Cloudflare) and `x-real-ip`
// are set by the proxy and are not client-spoofable. `x-forwarded-for` is a
// client-supplied chain and is only used as a last resort.
const IP_HEADER_PRIORITY = [
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for',
] as const;

function prune(map: Map<string, WindowState>, now: number) {
  for (const [key, state] of map) {
    if (now >= state.resetAt) map.delete(key);
  }
}

// Compact 64-bit hash so raw API keys never sit in the rate-limit map.
function hashKey(key: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < key.length; i++) {
    const ch = key.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0')
  );
}

export function clientIP(req: Request): string {
  for (const header of IP_HEADER_PRIORITY) {
    const value = req.headers.get(header);
    if (value) return value.split(',')[0].trim();
  }
  return 'unknown';
}

type LimitResult = { limited: boolean; retryAfterSeconds: number };

function checkAndIncrement(
  identity: string,
  windowMax: number,
  dayMax: number,
  now: number,
): LimitResult {
  const window = windows.get(identity);
  const day = days.get(identity);

  if (day && day.count >= dayMax) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((day.resetAt - now) / 1000),
    };
  }

  if (window && window.count >= windowMax) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000),
    };
  }

  if (window) {
    window.count += 1;
  } else {
    windows.set(identity, { count: 1, resetAt: now + WINDOW_MS });
  }

  if (day) {
    day.count += 1;
  } else {
    days.set(identity, { count: 1, resetAt: now + DAY_MS });
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function rateLimitStatus(ip: string): LimitResult {
  const now = Date.now();
  prune(windows, now);
  prune(days, now);
  return checkAndIncrement(ip, WINDOW_MAX, DAY_MAX, now);
}

/**
 * Per-API-key rate limit. Meant to run alongside the per-IP limit so that
 * rotating IPs cannot bypass the cap on a single (e.g. bundled) key.
 */
export function keyRateLimitStatus(key: string): LimitResult {
  const now = Date.now();
  prune(windows, now);
  prune(days, now);
  return checkAndIncrement(
    `key:${hashKey(key)}`,
    KEY_WINDOW_MAX,
    KEY_DAY_MAX,
    now,
  );
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
