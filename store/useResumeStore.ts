import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SECTION_ORDER, SectionId } from '@/lib/consts';
import { CVData, cvSchema, initialCVState } from '@/lib/schema';

export interface ResumeRecord {
  id: string;
  title: string;
  data: CVData;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  autoTitle: boolean;
  updatedAt: number;
}

export interface HistorySnapshot {
  data: CVData;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  at: number;
}

export interface ResumeHistory {
  entries: HistorySnapshot[];
  cursor: number;
}

const COALESCE_MS = 2_000;
const MAX_HISTORY_ENTRIES = 100;

interface ResumeState {
  resumes: ResumeRecord[];
  activeId: string | null;
  histories: Record<string, ResumeHistory>;
  revision: number;
  createResume: () => void;
  duplicateResume: (id: string) => void;
  deleteResume: (id: string) => void;
  renameResume: (id: string, title: string) => void;
  setActiveResume: (id: string) => void;
  updateResumeData: (id: string, data: CVData) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  resetSectionOrder: () => void;
  undo: () => void;
  redo: () => void;
  restoreHistory: (id: string, index: number) => void;
}

const LEGACY_KEY = 'curricula-data';
const STORAGE_KEY = 'curricula-resumes';

const now = () => Date.now();

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID();
  return `${now()}-${Math.random().toString(36).slice(2)}`;
}

function makeResume(
  data: CVData = initialCVState,
  title?: string,
): ResumeRecord {
  return {
    id: makeId(),
    title: title?.trim() || data.name?.trim() || 'Untitled CV',
    data,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    autoTitle: true,
    updatedAt: now(),
  };
}

function parseLegacyData(raw: string | null): CVData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = cvSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function seedResumes(): ResumeRecord[] {
  const legacy = parseLegacyData(localStorage.getItem(LEGACY_KEY));
  if (legacy) {
    localStorage.removeItem(LEGACY_KEY);
    return [makeResume(legacy)];
  }
  return [makeResume()];
}

function snapshotFromRecord(record: ResumeRecord): HistorySnapshot {
  return {
    data: record.data,
    sectionOrder: [...record.sectionOrder],
    hiddenSections: [...record.hiddenSections],
    at: now(),
  };
}

function seedHistory(record: ResumeRecord): ResumeHistory {
  return { entries: [snapshotFromRecord(record)], cursor: 0 };
}

function nextStateEqual(
  a: Pick<HistorySnapshot, 'data' | 'sectionOrder' | 'hiddenSections'>,
  b: Pick<HistorySnapshot, 'data' | 'sectionOrder' | 'hiddenSections'>,
): boolean {
  return (
    JSON.stringify(a.data) === JSON.stringify(b.data) &&
    JSON.stringify(a.sectionOrder) === JSON.stringify(b.sectionOrder) &&
    JSON.stringify(a.hiddenSections) === JSON.stringify(b.hiddenSections)
  );
}

function commitHistory(
  history: ResumeHistory | undefined,
  next: Pick<HistorySnapshot, 'data' | 'sectionOrder' | 'hiddenSections'>,
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
    entries[entries.length - 1] = { ...next, at };
  } else {
    entries.push({ ...next, at });
  }
  if (entries.length > MAX_HISTORY_ENTRIES) {
    entries.splice(0, entries.length - MAX_HISTORY_ENTRIES);
  }
  return { entries, cursor: entries.length - 1 };
}

function applySnapshot(
  state: ResumeState,
  id: string,
  index: number,
): Partial<ResumeState> | undefined {
  const history = state.histories[id];
  const snapshot = history?.entries[index];
  const record = state.resumes.find((r) => r.id === id);
  if (!history || !snapshot || !record || index === history.cursor) {
    return undefined;
  }
  const updated: ResumeRecord = {
    ...record,
    data: snapshot.data,
    sectionOrder: snapshot.sectionOrder,
    hiddenSections: snapshot.hiddenSections,
    updatedAt: now(),
    title: record.autoTitle
      ? snapshot.data.name?.trim() || 'Untitled CV'
      : record.title,
  };
  return {
    resumes: state.resumes.map((r) => (r.id === id ? updated : r)),
    histories: { ...state.histories, [id]: { ...history, cursor: index } },
    revision: state.revision + 1,
  };
}

function commitActiveSectionChange(
  state: ResumeState,
  patch: Partial<Pick<ResumeRecord, 'sectionOrder' | 'hiddenSections'>>,
): Partial<ResumeState> {
  const { resumes, activeId } = state;
  if (!activeId) return {};
  const record = resumes.find((r) => r.id === activeId);
  if (!record) return {};
  const next = { ...record, ...patch };
  const unchanged =
    JSON.stringify(next.sectionOrder) === JSON.stringify(record.sectionOrder) &&
    JSON.stringify(next.hiddenSections) ===
      JSON.stringify(record.hiddenSections);
  if (unchanged) return {};
  return {
    resumes: resumes.map((r) => (r.id === activeId ? next : r)),
    histories: {
      ...state.histories,
      [activeId]: commitHistory(
        state.histories[activeId],
        {
          data: record.data,
          sectionOrder: next.sectionOrder,
          hiddenSections: next.hiddenSections,
        },
        now(),
      ),
    },
  };
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumes: [],
      activeId: null,
      histories: {},
      revision: 0,

      createResume: () => {
        const record = makeResume();
        set((state) => ({
          resumes: [...state.resumes, record],
          activeId: record.id,
          histories: { ...state.histories, [record.id]: seedHistory(record) },
        }));
      },

      duplicateResume: (id) => {
        set((state) => {
          const source = state.resumes.find((r) => r.id === id);
          if (!source) return {};
          const copy: ResumeRecord = {
            ...source,
            id: makeId(),
            title: `${source.title} (copy)`,
            autoTitle: false,
            updatedAt: now(),
          };
          const index = state.resumes.findIndex((r) => r.id === id);
          const resumes = [...state.resumes];
          resumes.splice(index + 1, 0, copy);
          return {
            resumes,
            activeId: copy.id,
            histories: {
              ...state.histories,
              [copy.id]: seedHistory(copy),
            },
          };
        });
      },

      deleteResume: (id) => {
        set((state) => {
          if (state.resumes.length <= 1) return {};
          const resumes = state.resumes.filter((r) => r.id !== id);
          const activeId =
            state.activeId === id ? resumes[0].id : state.activeId;
          const histories = { ...state.histories };
          delete histories[id];
          return { resumes, activeId, histories };
        });
      },

      renameResume: (id, title) => {
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id
              ? { ...r, title: title.trim() || r.title, autoTitle: false }
              : r,
          ),
        }));
      },

      setActiveResume: (id) =>
        set((state) => {
          if (state.activeId === id) return {};
          const record = state.resumes.find((r) => r.id === id);
          if (!record) return {};
          if (state.histories[id]) return { activeId: id };
          return {
            activeId: id,
            histories: { ...state.histories, [id]: seedHistory(record) },
          };
        }),

      updateResumeData: (id, data) => {
        set((state) => {
          const record = state.resumes.find((r) => r.id === id);
          if (!record) return {};
          if (JSON.stringify(record.data) === JSON.stringify(data)) return {};
          const updated: ResumeRecord = {
            ...record,
            data,
            updatedAt: now(),
            title: record.autoTitle
              ? data.name?.trim() || 'Untitled CV'
              : record.title,
          };
          return {
            resumes: state.resumes.map((r) => (r.id === id ? updated : r)),
            histories: {
              ...state.histories,
              [id]: commitHistory(
                state.histories[id],
                {
                  data,
                  sectionOrder: record.sectionOrder,
                  hiddenSections: record.hiddenSections,
                },
                now(),
              ),
            },
          };
        });
      },

      moveSection: (fromIndex, toIndex) =>
        set((state) => {
          const order = [
            ...(state.resumes.find((r) => r.id === state.activeId)
              ?.sectionOrder ?? []),
          ];
          const [moved] = order.splice(fromIndex, 1);
          order.splice(toIndex, 0, moved);
          return commitActiveSectionChange(state, { sectionOrder: order });
        }),

      toggleSectionVisibility: (sectionId) =>
        set((state) => {
          const record = state.resumes.find((r) => r.id === state.activeId);
          if (!record) return {};
          const hiddenSections = record.hiddenSections.includes(sectionId)
            ? record.hiddenSections.filter((id) => id !== sectionId)
            : [...record.hiddenSections, sectionId];
          return commitActiveSectionChange(state, { hiddenSections });
        }),

      resetSectionOrder: () =>
        set((state) =>
          commitActiveSectionChange(state, {
            sectionOrder: [...DEFAULT_SECTION_ORDER],
          }),
        ),

      undo: () =>
        set((state) => {
          const id = state.activeId;
          if (!id) return {};
          const history = state.histories[id];
          if (!history || history.cursor <= 0) return {};
          return applySnapshot(state, id, history.cursor - 1) ?? {};
        }),

      redo: () =>
        set((state) => {
          const id = state.activeId;
          if (!id) return {};
          const history = state.histories[id];
          if (!history || history.cursor >= history.entries.length - 1) {
            return {};
          }
          return applySnapshot(state, id, history.cursor + 1) ?? {};
        }),

      restoreHistory: (id, index) =>
        set((state) => applySnapshot(state, id, index) ?? {}),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        resumes: state.resumes,
        activeId: state.activeId,
      }),
      merge: (persisted, current) => {
        const base = { ...current, ...(persisted as Partial<ResumeState>) };
        let resumes = base.resumes ?? [];
        if (resumes.length === 0) {
          resumes = seedResumes();
        }
        const activeId = base.activeId ?? resumes[0].id;
        const record = resumes.find((r) => r.id === activeId);
        const histories = record ? { [record.id]: seedHistory(record) } : {};
        return { ...base, resumes, activeId, histories };
      },
    },
  ),
);
