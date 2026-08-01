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

interface ResumeState {
    resumes: ResumeRecord[];
    activeId: string | null;
    createResume: () => void;
    duplicateResume: (id: string) => void;
    deleteResume: (id: string) => void;
    renameResume: (id: string, title: string) => void;
    setActiveResume: (id: string) => void;
    updateResumeData: (id: string, data: CVData) => void;
    moveSection: (fromIndex: number, toIndex: number) => void;
    toggleSectionVisibility: (sectionId: SectionId) => void;
    resetSectionOrder: () => void;
}

const LEGACY_KEY = 'curricula-data';
const STORAGE_KEY = 'curricula-resumes';

const now = () => Date.now();

function makeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `${now()}-${Math.random().toString(36).slice(2)}`;
}

function makeResume(data: CVData = initialCVState, title?: string): ResumeRecord {
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

function updateActive(
    state: ResumeState,
    fn: (record: ResumeRecord) => ResumeRecord,
): Partial<ResumeState> {
    const { resumes, activeId } = state;
    if (!activeId) return {};
    return { resumes: resumes.map((r) => (r.id === activeId ? fn(r) : r)) };
}

export const useResumeStore = create<ResumeState>()(
    persist(
        (set) => ({
            resumes: [],
            activeId: null,

            createResume: () => {
                const record = makeResume();
                set((state) => ({ resumes: [...state.resumes, record], activeId: record.id }));
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
                    return { resumes, activeId: copy.id };
                });
            },

            deleteResume: (id) => {
                set((state) => {
                    if (state.resumes.length <= 1) return {};
                    const resumes = state.resumes.filter((r) => r.id !== id);
                    const activeId = state.activeId === id ? resumes[0].id : state.activeId;
                    return { resumes, activeId };
                });
            },

            renameResume: (id, title) => {
                set((state) => ({
                    resumes: state.resumes.map((r) =>
                        r.id === id ? { ...r, title: title.trim() || r.title, autoTitle: false } : r,
                    ),
                }));
            },

            setActiveResume: (id) => set({ activeId: id }),

            updateResumeData: (id, data) => {
                set((state) => ({
                    resumes: state.resumes.map((r) =>
                        r.id === id
                            ? {
                                  ...r,
                                  data,
                                  updatedAt: now(),
                                  title: r.autoTitle ? data.name?.trim() || 'Untitled CV' : r.title,
                              }
                            : r,
                    ),
                }));
            },

            moveSection: (fromIndex, toIndex) =>
                set((state) =>
                    updateActive(state, (r) => {
                        const order = [...r.sectionOrder];
                        const [moved] = order.splice(fromIndex, 1);
                        order.splice(toIndex, 0, moved);
                        return { ...r, sectionOrder: order };
                    }),
                ),

            toggleSectionVisibility: (sectionId) =>
                set((state) =>
                    updateActive(state, (r) => ({
                        ...r,
                        hiddenSections: r.hiddenSections.includes(sectionId)
                            ? r.hiddenSections.filter((id) => id !== sectionId)
                            : [...r.hiddenSections, sectionId],
                    })),
                ),

            resetSectionOrder: () =>
                set((state) =>
                    updateActive(state, (r) => ({ ...r, sectionOrder: [...DEFAULT_SECTION_ORDER] })),
                ),
        }),
        {
            name: STORAGE_KEY,
            merge: (persisted, current) => {
                const base = { ...current, ...(persisted as Partial<ResumeState>) };
                const resumes = base.resumes ?? [];
                if (resumes.length === 0) {
                    const seeded = seedResumes();
                    return { ...base, resumes: seeded, activeId: seeded[0].id };
                }
                return { ...base, activeId: base.activeId ?? resumes[0].id };
            },
        },
    ),
);
