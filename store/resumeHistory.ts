import type {
  HistorySnapshot,
  ResumeHistory,
  ResumeRecord,
} from './useResumeStore';
import { now } from './resumeFactory';

export const COALESCE_MS = 2_000;
export const MAX_HISTORY_ENTRIES = 100;

type HistoryState = Omit<HistorySnapshot, 'at'>;

export function isJsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function historyState(record: ResumeRecord): HistoryState {
  return {
    data: structuredClone(record.data),
    sectionOrder: [...record.sectionOrder],
    hiddenSections: [...record.hiddenSections],
    title: record.title,
    autoTitle: record.autoTitle,
    language: record.language,
    photo: record.photo,
    templateId: record.templateId,
    design: { ...record.design },
  };
}

function snapshot(state: HistoryState, at: number): HistorySnapshot {
  return { ...state, at };
}

function snapshotFromRecord(record: ResumeRecord): HistorySnapshot {
  return snapshot(historyState(record), now());
}

export function seedHistory(record: ResumeRecord): ResumeHistory {
  return { entries: [snapshotFromRecord(record)], cursor: 0 };
}

function nextStateEqual(a: HistoryState, b: HistoryState): boolean {
  return (
    isJsonEqual(
      [a.data, a.sectionOrder, a.hiddenSections],
      [b.data, b.sectionOrder, b.hiddenSections],
    ) &&
    a.title === b.title &&
    a.autoTitle === b.autoTitle &&
    a.language === b.language &&
    a.photo === b.photo &&
    a.templateId === b.templateId &&
    isJsonEqual(a.design, b.design)
  );
}

export function commitHistory(
  history: ResumeHistory | undefined,
  next: HistoryState,
  at: number,
): ResumeHistory {
  const truncated = !!(history && history.cursor < history.entries.length - 1);
  if (truncated && history) {
    history = {
      entries: history.entries.slice(0, history.cursor + 1),
      cursor: history.cursor,
    };
  }
  const tip = history?.entries[history.entries.length - 1];
  if (tip && nextStateEqual(tip, next)) {
    return history ?? { entries: [], cursor: -1 };
  }
  const entries = history ? [...history.entries] : [];
  const last = entries[entries.length - 1];
  const canCoalesce =
    !truncated && last && entries.length > 1 && at - last.at < COALESCE_MS;
  if (canCoalesce) {
    entries[entries.length - 1] = snapshot(next, at);
  } else {
    entries.push(snapshot(next, at));
  }
  if (entries.length > MAX_HISTORY_ENTRIES) {
    entries.splice(0, entries.length - MAX_HISTORY_ENTRIES);
  }
  return { entries, cursor: entries.length - 1 };
}
