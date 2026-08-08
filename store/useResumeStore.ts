import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SECTION_ORDER, SectionId } from '@/lib/consts';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { CVData, cvDataStoredSchema, initialCVState } from '@/lib/schema';
import { createQuotaAwareStorage } from '@/lib/storage';
import { DEFAULT_TEMPLATE_ID, TemplateId } from '@/lib/templates';
import { usePhotoStore } from '@/store/usePhotoStore';

export interface ResumeRecord {
  id: string;
  title: string;
  data: CVData;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  language: ResumeLanguage;
  photo: string;
  templateId: TemplateId;
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

export interface ResumeState {
  resumes: ResumeRecord[];
  activeId: string | null;
  histories: Record<string, ResumeHistory>;
  revision: number;
  createResume: () => void;
  duplicateResume: (id: string) => void;
  deleteResume: (id: string) => void;
  renameResume: (id: string, title: string) => void;
  setActiveResume: (id: string) => void;
  importResumeData: (
    data: CVData,
    title?: string,
    options?: {
      language?: ResumeLanguage;
      photo?: string;
      template?: TemplateId;
    },
  ) => void;
  setResumeLanguage: (id: string, language: ResumeLanguage) => void;
  setResumePhoto: (id: string, photo: string) => void;
  setResumeTemplate: (id: string, template: TemplateId) => void;
  restoreBackup: (resumes: ResumeRecord[], activeId: string | null) => void;
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

/** Shape of the resume store payload persisted to localStorage. */
type PersistedResumeState = {
  resumes: Array<Omit<ResumeRecord, 'photo'>>;
  activeId: string | null;
};

const now = () => Date.now();

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID();
  return `${now()}-${Math.random().toString(36).slice(2)}`;
}

function makeResume(
  data: CVData = initialCVState,
  title?: string,
  options: {
    language?: ResumeLanguage;
    photo?: string;
    template?: TemplateId;
  } = {},
): ResumeRecord {
  return {
    id: makeId(),
    title: title?.trim() || data.name?.trim() || 'Untitled CV',
    data,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    language: options.language ?? 'en',
    photo: options.photo ?? '',
    templateId: options.template ?? DEFAULT_TEMPLATE_ID,
    autoTitle: true,
    updatedAt: now(),
  };
}

function normalizeResume(record: ResumeRecord): ResumeRecord {
  return {
    ...record,
    language: record.language ?? 'en',
    photo: record.photo ?? '',
    templateId: record.templateId ?? DEFAULT_TEMPLATE_ID,
  };
}

/** Resume record without the photo, which persists in the dedicated store. */
function withoutPhoto(record: ResumeRecord): Omit<ResumeRecord, 'photo'> {
  return {
    id: record.id,
    title: record.title,
    data: record.data,
    sectionOrder: record.sectionOrder,
    hiddenSections: record.hiddenSections,
    language: record.language,
    templateId: record.templateId,
    autoTitle: record.autoTitle,
    updatedAt: record.updatedAt,
  };
}

function parseLegacyData(raw: string | null): CVData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Validate with the lenient storage schema: a CV saved mid-edit (e.g. a
    // short or empty summary) must survive migration instead of being
    // silently discarded. Missing fields fall back to initialCVState.
    const result = cvDataStoredSchema.safeParse(parsed);
    if (!result.success) return null;
    return { ...initialCVState, ...result.data };
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

function snapshot(
  next: Pick<HistorySnapshot, 'data' | 'sectionOrder' | 'hiddenSections'>,
  at: number,
): HistorySnapshot {
  return {
    // Deep-copy the CV data so history entries never share mutable references
    // with the live record. Any future in-place mutation of `record.data`
    // would otherwise corrupt every snapshot simultaneously.
    data: structuredClone(next.data),
    sectionOrder: [...next.sectionOrder],
    hiddenSections: [...next.hiddenSections],
    at,
  };
}

function snapshotFromRecord(record: ResumeRecord): HistorySnapshot {
  return snapshot(record, now());
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
    entries[entries.length - 1] = snapshot(next, at);
  } else {
    entries.push(snapshot(next, at));
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
          if (copy.photo) {
            usePhotoStore.getState().setPhoto(copy.id, copy.photo);
          }
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
          usePhotoStore.getState().removePhotos([id]);
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

      importResumeData: (data, title, options) =>
        set((state) => {
          const record = makeResume(data, title, options);
          if (record.photo) {
            usePhotoStore.getState().setPhoto(record.id, record.photo);
          }
          return {
            resumes: [...state.resumes, record],
            activeId: record.id,
            histories: {
              ...state.histories,
              [record.id]: seedHistory(record),
            },
          };
        }),

      setResumeLanguage: (id, language) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id && r.language !== language
              ? { ...r, language, updatedAt: now() }
              : r,
          ),
        })),

      setResumePhoto: (id, photo) => {
        usePhotoStore.getState().setPhoto(id, photo);
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id && r.photo !== photo
              ? { ...r, photo, updatedAt: now() }
              : r,
          ),
        }));
      },

      setResumeTemplate: (id, templateId) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id && r.templateId !== templateId
              ? { ...r, templateId, updatedAt: now() }
              : r,
          ),
        })),

      restoreBackup: (resumes, activeId) =>
        set((state) => {
          if (resumes.length === 0) return {};
          const normalized = resumes.map(normalizeResume);
          // Backups carry photos inline on each record; mirror them into the
          // dedicated photo store so the persisted CV payload stays lean.
          const photos: Record<string, string> = {
            ...usePhotoStore.getState().photos,
          };
          for (const record of normalized) {
            photos[record.id] = record.photo ?? '';
          }
          usePhotoStore.setState({ photos });
          const targetId = normalized.some((r) => r.id === activeId)
            ? activeId
            : normalized[0].id;
          const histories: Record<string, ResumeHistory> = {};
          for (const record of normalized) {
            histories[record.id] = seedHistory(record);
          }
          return {
            resumes: normalized,
            activeId: targetId,
            histories,
            revision: state.revision + 1,
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
      // Photos live in the dedicated photo store (see usePhotoStore); keeping
      // them out of the resume payload keeps the per-keystroke autosave write
      // small. Hydration is ordered manually after the photo store so photos
      // can be reattached during merge.
      skipHydration: true,
      storage: createQuotaAwareStorage<PersistedResumeState>(),
      partialize: (state) => ({
        resumes: state.resumes.map(withoutPhoto),
        activeId: state.activeId,
      }),
      merge: (persisted, current) => {
        const base = { ...current, ...(persisted as Partial<ResumeState>) };
        let resumes = (base.resumes ?? []).map(normalizeResume);
        // Migrate photos that were stored inline on resume records (previous
        // storage layout) into the photo store, then reattach. The photo store
        // wins when both layouts hold a value for the same resume.
        const photos = { ...usePhotoStore.getState().photos };
        for (const record of resumes) {
          if (record.photo && !(record.id in photos)) {
            photos[record.id] = record.photo;
          }
        }
        if (Object.keys(photos).length > 0) {
          usePhotoStore.setState({ photos });
        }
        resumes = resumes.map((record) => ({
          ...record,
          photo: photos[record.id] ?? '',
        }));
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
