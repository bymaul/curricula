interface ErrorPayload {
  error?: unknown;
}

const DEFAULT_RETRY_AFTER_SECONDS = 60;

/** Thrown when the server responds 429. Carries the Retry-After hint. */
export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Thrown when the client aborts a request via its own timeout. */
export class RequestTimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'RequestTimeoutError';
  }
}

function readRetryAfter(response: Response): number {
  const value = response.headers.get('retry-after');
  const seconds = value === null ? NaN : Number(value);
  return Number.isFinite(seconds) && seconds >= 0
    ? Math.ceil(seconds)
    : DEFAULT_RETRY_AFTER_SECONDS;
}

export async function parseResponseJSON<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (response.status === 429) {
    throw new RateLimitError(readRetryAfter(response));
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as ErrorPayload).error === 'string'
        ? ((data as ErrorPayload).error as string)
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
