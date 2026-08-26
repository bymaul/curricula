import { cvSchema } from '@/lib/schema';
import type { CVData } from '@/lib/schema';

export type CvJsonParseErrorKind = 'syntax' | 'schema';

export interface CvJsonParseSuccess {
  ok: true;
  data: CVData;
}

export interface CvJsonParseFailure {
  ok: false;
  kind: CvJsonParseErrorKind;
  issues: string[];
}

export type CvJsonParseResult = CvJsonParseSuccess | CvJsonParseFailure;

const MAX_ISSUES = 5;

function formatPath(path: PropertyKey[]): string {
  let out = '';
  for (const segment of path) {
    if (typeof segment === 'number') {
      out += `[${segment}]`;
    } else {
      out += out ? `.${String(segment)}` : String(segment);
    }
  }
  return out;
}

export function parseCvJson(raw: string): CvJsonParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      kind: 'syntax',
      issues: [error instanceof Error ? error.message : String(error)],
    };
  }

  const result = cvSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.slice(0, MAX_ISSUES).map((issue) => {
      const path = formatPath(issue.path);
      return `${path || '(root)'}: ${issue.message}`;
    });
    const remaining = result.error.issues.length - issues.length;
    if (remaining > 0) {
      issues.push(`+${remaining} more`);
    }
    return { ok: false, kind: 'schema', issues };
  }

  return { ok: true, data: result.data };
}
