import { beforeEach, describe, expect, it } from 'vitest';
import { resetStorageStateForTests } from '@/lib/storage';
import { usePhotoStore } from '@/store/usePhotoStore';

const STORAGE_KEY = 'curricula-photos';

beforeEach(() => {
  resetStorageStateForTests();
  usePhotoStore.setState({ photos: {} });
});

describe('usePhotoStore', () => {
  it('sets and reads photos', () => {
    usePhotoStore.getState().setPhoto('r1', 'data:image/jpeg;base64,QQ==');

    expect(usePhotoStore.getState().photos).toEqual({
      r1: 'data:image/jpeg;base64,QQ==',
    });
  });

  it('keeps the photos reference when the value is unchanged', () => {
    usePhotoStore.getState().setPhoto('r1', 'data:image/jpeg;base64,QQ==');
    const before = usePhotoStore.getState().photos;

    usePhotoStore.getState().setPhoto('r1', 'data:image/jpeg;base64,QQ==');

    expect(usePhotoStore.getState().photos).toBe(before);
  });

  it('removes only the requested photos', () => {
    usePhotoStore.getState().setPhoto('r1', 'a');
    usePhotoStore.getState().setPhoto('r2', 'b');

    usePhotoStore.getState().removePhotos(['r1', 'missing']);

    expect(usePhotoStore.getState().photos).toEqual({ r2: 'b' });
  });

  it('persists photos to localStorage', () => {
    usePhotoStore.getState().setPhoto('r1', 'data:image/jpeg;base64,QQ==');

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state.photos).toEqual({
      r1: 'data:image/jpeg;base64,QQ==',
    });
  });
});
