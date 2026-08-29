import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SECTION_ORDER, SECTION_IDS, SectionId } from '@/lib/consts';
import { DesignSettings, normalizeDesign } from '@/lib/design';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { CVData, cvDataStoredSchema, initialCVState } from '@/lib/schema';
import { createIdbStorage } from '@/lib/idbStorage';
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
  design: DesignSettings;
  autoTitle: boolean;
  updatedAt: number;
}

export interface HistorySnapshot {
  data: CVData;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  title: string;
  autoTitle: boolean;
  language: ResumeLanguage;
  photo: string;
  templateId: TemplateId;
  design: DesignSettings;
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
      design?: DesignSettings;
    },
  ) => void;
  setResumeLanguage: (id: string, language: ResumeLanguage) => void;
  setResumePhoto: (id: string, photo: string) => void;
  setResumeTemplate: (id: string, template: TemplateId) => void;
  setResumeDesign: (id: string, design: DesignSettings) => void;
  restoreBackup: (resumes: ResumeRecord[], activeId: string | null) => void;
  updateResumeData: (id: string, data: CVData) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  resetSectionOrder: () => void;
  addCustomSection: (title: string) => void;
  renameCustomSection: (id: string, title: string) => void;
  removeCustomSection: (id: string) => void;
  undo: () => void;
  redo: () => void;
  restoreHistory: (id: string, index: number) => void;
}

const LEGACY_KEY = 'curricula-data';
const STORAGE_KEY = 'curricula-resumes';

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
    design?: DesignSettings;
  } = {},
): ResumeRecord {
  return {
    id: makeId(),
    title: title?.trim() || data.name?.trim() || 'Untitled CV',
    data,
    sectionOrder: [
      ...DEFAULT_SECTION_ORDER,
      ...Object.keys(data.customSections ?? {}),
    ],
    hiddenSections: [],
    language: options.language ?? 'en',
    photo: options.photo ?? '',
    templateId: options.template ?? DEFAULT_TEMPLATE_ID,
    design: normalizeDesign(options.design),
    autoTitle: true,
    updatedAt: now(),
  };
}

function normalizeResume(record: ResumeRecord): ResumeRecord {
  const customIds = Object.keys(record.data?.customSections ?? {});
  const validIds = new Set<string>([...SECTION_IDS, ...customIds]);
  const sectionOrder = (
    record.sectionOrder ?? [...DEFAULT_SECTION_ORDER]
  ).filter((id) => validIds.has(id));
  for (const id of customIds) {
    if (!sectionOrder.includes(id)) sectionOrder.push(id);
  }
  return {
    ...record,
    sectionOrder,
    hiddenSections: (record.hiddenSections ?? []).filter((id) =>
      validIds.has(id),
    ),
    language: record.language ?? 'en',
    photo: record.photo ?? '',
    templateId: record.templateId ?? DEFAULT_TEMPLATE_ID,
    design: normalizeDesign(record.design),
  };
}

function withoutPhoto(record: ResumeRecord): Omit<ResumeRecord, 'photo'> {
  return {
    id: record.id,
    title: record.title,
    data: record.data,
    sectionOrder: record.sectionOrder,
    hiddenSections: record.hiddenSections,
    language: record.language,
    templateId: record.templateId,
    design: record.design,
    autoTitle: record.autoTitle,
    updatedAt: record.updatedAt,
  };
}

function parseLegacyData(raw: string | null): CVData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
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

type HistoryState = Omit<HistorySnapshot, 'at'>;

function historyState(record: ResumeRecord): HistoryState {
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

function seedHistory(record: ResumeRecord): ResumeHistory {
  return { entries: [snapshotFromRecord(record)], cursor: 0 };
}

function nextStateEqual(a: HistoryState, b: HistoryState): boolean {
  return (
    JSON.stringify([a.data, a.sectionOrder, a.hiddenSections]) ===
      JSON.stringify([b.data, b.sectionOrder, b.hiddenSections]) &&
    a.title === b.title &&
    a.autoTitle === b.autoTitle &&
    a.language === b.language &&
    a.photo === b.photo &&
    a.templateId === b.templateId &&
    JSON.stringify(a.design) === JSON.stringify(b.design)
  );
}

function commitHistory(
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
    title: snapshot.title,
    autoTitle: snapshot.autoTitle,
    language: snapshot.language,
    photo: snapshot.photo,
    templateId: snapshot.templateId,
    design: snapshot.design,
    updatedAt: now(),
  };
  if (snapshot.photo !== record.photo) {
    usePhotoStore.getState().setPhoto(id, snapshot.photo);
  }
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
  const { activeId } = state;
  if (!activeId) return {};
  return commitResumeChange(state, activeId, patch);
}

function commitResumeChange(
  state: ResumeState,
  id: string,
  patch: Partial<
    Pick<ResumeRecord, 'data' | 'sectionOrder' | 'hiddenSections'>
  >,
): Partial<ResumeState> {
  const record = state.resumes.find((r) => r.id === id);
  if (!record) return {};
  const next: ResumeRecord = { ...record, ...patch };
  const unchanged =
    JSON.stringify([next.data, next.sectionOrder, next.hiddenSections]) ===
    JSON.stringify([record.data, record.sectionOrder, record.hiddenSections]);
  if (unchanged) return {};
  return {
    resumes: state.resumes.map((r) => (r.id === id ? next : r)),
    histories: {
      ...state.histories,
      [id]: commitHistory(state.histories[id], historyState(next), now()),
    },
    revision: state.revision + 1,
  };
}

function commitMetadataChange(
  state: ResumeState,
  id: string,
  patch: Partial<
    Pick<
      ResumeRecord,
      'title' | 'autoTitle' | 'language' | 'photo' | 'templateId' | 'design'
    >
  >,
): Partial<ResumeState> {
  const record = state.resumes.find((r) => r.id === id);
  if (!record) return {};
  const next: ResumeRecord = { ...record, ...patch };
  const unchanged =
    next.title === record.title &&
    next.autoTitle === record.autoTitle &&
    next.language === record.language &&
    next.photo === record.photo &&
    next.templateId === record.templateId &&
    JSON.stringify(next.design) === JSON.stringify(record.design);
  if (unchanged) return {};
  return {
    resumes: state.resumes.map((r) => (r.id === id ? next : r)),
    histories: {
      ...state.histories,
      [id]: commitHistory(state.histories[id], historyState(next), now()),
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

      renameResume: (id, title) =>
        set((state) => {
          const record = state.resumes.find((r) => r.id === id);
          if (!record) return {};
          return commitMetadataChange(state, id, {
            title: title.trim() || record.title,
            autoTitle: false,
          });
        }),

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
        set((state) => commitMetadataChange(state, id, { language })),

      setResumePhoto: (id, photo) => {
        usePhotoStore.getState().setPhoto(id, photo);
        set((state) => commitMetadataChange(state, id, { photo }));
      },

      setResumeTemplate: (id, templateId) =>
        set((state) => commitMetadataChange(state, id, { templateId })),

      setResumeDesign: (id, design) =>
        set((state) => commitMetadataChange(state, id, { design })),

      restoreBackup: (resumes, activeId) =>
        set((state) => {
          if (resumes.length === 0) return {};
          const normalized = resumes.map(normalizeResume);
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
                historyState(updated),
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
        set((state) => {
          const record = state.resumes.find((r) => r.id === state.activeId);
          if (!record) return {};
          return commitActiveSectionChange(state, {
            sectionOrder: [
              ...DEFAULT_SECTION_ORDER,
              ...Object.keys(record.data.customSections ?? {}),
            ],
          });
        }),

      addCustomSection: (title) =>
        set((state) => {
          const id = state.activeId;
          const trimmed = title.trim();
          if (!id || !trimmed) return {};
          const record = state.resumes.find((r) => r.id === id);
          if (!record) return {};
          const section = { id: makeId(), title: trimmed, items: [] };
          return commitResumeChange(state, id, {
            data: {
              ...record.data,
              customSections: {
                ...(record.data.customSections ?? {}),
                [section.id]: section,
              },
            },
            sectionOrder: [...record.sectionOrder, section.id],
          });
        }),

      renameCustomSection: (sectionId, title) =>
        set((state) => {
          const id = state.activeId;
          const trimmed = title.trim();
          if (!id || !trimmed) return {};
          const record = state.resumes.find((r) => r.id === id);
          if (!record) return {};
          return commitResumeChange(state, id, {
            data: {
              ...record.data,
              customSections: {
                ...(record.data.customSections ?? {}),
                [sectionId]: {
                  ...(record.data.customSections ?? {})[sectionId],
                  title: trimmed,
                  id: sectionId,
                },
              },
            },
          });
        }),

      removeCustomSection: (sectionId) =>
        set((state) => {
          const id = state.activeId;
          if (!id) return {};
          const record = state.resumes.find((r) => r.id === id);
          if (!record) return {};
          return commitResumeChange(state, id, {
            data: {
              ...record.data,
              customSections: Object.fromEntries(
                Object.entries(record.data.customSections ?? {}).filter(
                  ([key]) => key !== sectionId,
                ),
              ),
            },
            sectionOrder: record.sectionOrder.filter((x) => x !== sectionId),
            hiddenSections: record.hiddenSections.filter(
              (x) => x !== sectionId,
            ),
          });
        }),

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
      skipHydration: true,
      storage: createIdbStorage<PersistedResumeState>(),
      partialize: (state) => ({
        resumes: state.resumes.map(withoutPhoto),
        activeId: state.activeId,
      }),
      merge: (persisted, current) => {
        const base = { ...current, ...(persisted as Partial<ResumeState>) };
        let resumes = (base.resumes ?? []).map(normalizeResume);
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
