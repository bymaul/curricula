import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SECTION_ORDER, SectionId } from '@/lib/consts';
import { DesignSettings } from '@/lib/design';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { CVData } from '@/lib/schema';
import { createIdbStorage } from '@/lib/idbStorage';
import { TemplateId } from '@/lib/templates';
import { usePhotoStore } from '@/store/usePhotoStore';
import {
  makeId,
  makeResume,
  normalizeResume,
  now,
  seedResumes,
  withoutPhoto,
} from './resumeFactory';
import {
  commitHistory,
  historyState,
  isJsonEqual,
  seedHistory,
} from './resumeHistory';

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
  favorite?: boolean;
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

export interface ResumeState {
  resumes: ResumeRecord[];
  activeId: string | null;
  histories: Record<string, ResumeHistory>;
  revision: number;
  createResume: () => void;
  duplicateResume: (id: string) => void;
  deleteResume: (id: string) => void;
  renameResume: (id: string, title: string) => void;
  toggleFavorite: (id: string) => void;
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

const STORAGE_KEY = 'curricula-resumes';

type PersistedResumeState = {
  resumes: Array<Omit<ResumeRecord, 'photo'>>;
  activeId: string | null;
};

function commitPatch(
  state: ResumeState,
  id: string,
  patch: Partial<ResumeRecord>,
  isUnchanged: (record: ResumeRecord, next: ResumeRecord) => boolean,
  bumpRevision: boolean,
): Partial<ResumeState> {
  const record = state.resumes.find((r) => r.id === id);
  if (!record) return {};
  const next: ResumeRecord = { ...record, ...patch };
  if (isUnchanged(record, next)) return {};
  const partial: Partial<ResumeState> = {
    resumes: state.resumes.map((r) => (r.id === id ? next : r)),
    histories: {
      ...state.histories,
      [id]: commitHistory(state.histories[id], historyState(next), now()),
    },
  };
  if (bumpRevision) partial.revision = state.revision + 1;
  return partial;
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
  return commitPatch(
    state,
    id,
    patch,
    (record, next) =>
      isJsonEqual(
        [next.data, next.sectionOrder, next.hiddenSections],
        [record.data, record.sectionOrder, record.hiddenSections],
      ),
    true,
  );
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
  return commitPatch(
    state,
    id,
    patch,
    (record, next) =>
      next.title === record.title &&
      next.autoTitle === record.autoTitle &&
      next.language === record.language &&
      next.photo === record.photo &&
      next.templateId === record.templateId &&
      isJsonEqual(next.design, record.design),
    false,
  );
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

      toggleFavorite: (id) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === id ? { ...r, favorite: !r.favorite } : r,
          ),
        })),

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
          if (isJsonEqual(record.data, data)) return {};
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
