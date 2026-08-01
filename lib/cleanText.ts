const INVISIBLE_CHARS = /[\u200B-\u200D\u200E\u200F\u2060\u00AD\uFEFF]/g;

export function stripInvisibleChars(input: string): string {
  return input.replace(INVISIBLE_CHARS, '');
}

export function sanitizeJSON<T>(value: T): T {
  if (typeof value === 'string') {
    return stripInvisibleChars(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJSON(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = sanitizeJSON(item);
    }
    return result as T;
  }
  return value;
}
