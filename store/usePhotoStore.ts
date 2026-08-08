import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createQuotaAwareStorage } from '@/lib/storage';

const STORAGE_KEY = 'curricula-photos';

export interface PhotoState {
  /** Resume id → photo data URL. Kept out of the per-keystroke CV payload. */
  photos: Record<string, string>;
  setPhoto: (id: string, photo: string) => void;
  removePhotos: (ids: string[]) => void;
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set) => ({
      photos: {},
      setPhoto: (id, photo) =>
        set((state) => {
          if (state.photos[id] === photo) return {};
          return { photos: { ...state.photos, [id]: photo } };
        }),
      removePhotos: (ids) =>
        set((state) => {
          const present = ids.filter((id) => id in state.photos);
          if (present.length === 0) return {};
          const photos = { ...state.photos };
          for (const id of present) delete photos[id];
          return { photos };
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createQuotaAwareStorage<PhotoState>(),
    },
  ),
);
