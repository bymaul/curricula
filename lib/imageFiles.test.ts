import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_CV_IMAGE_BASE64_CHARS, MAX_CV_IMAGES } from '@/lib/cvParsing';
import { readImagePartsFromFiles } from '@/lib/imageFiles';

interface FileReaderLike {
  result: string | ArrayBuffer | null;
  error: Error | null;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  readAsDataURL(file: File): void;
}

let results: Array<string | Error> = [];
let readCount = 0;

class FakeFileReader implements FileReaderLike {
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL() {
    readCount += 1;
    const next = results[readCount - 1];
    if (next instanceof Error) {
      this.error = next;
      this.onerror?.();
    } else {
      this.result = next;
      this.onload?.();
    }
  }
}

const makeFile = (name: string, type: string) =>
  ({ name, type }) as unknown as File;

const jpegDataUrl = 'data:image/jpeg;base64,QUJD';

beforeEach(() => {
  results = [];
  readCount = 0;
  globalThis.FileReader = FakeFileReader as unknown as typeof FileReader;
});

afterEach(() => {
  delete (globalThis as { FileReader?: unknown }).FileReader;
});

describe('readImagePartsFromFiles', () => {
  it('reads supported images into base64 parts', async () => {
    results = [jpegDataUrl];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('jd.jpg', 'image/jpeg'),
    ]);
    expect(errors).toEqual([]);
    expect(parts).toEqual([{ data: 'QUJD', mimeType: 'image/jpeg' }]);
  });

  it('infers the mime type from the extension when absent', async () => {
    results = ['data:image/png;base64,UEdO'];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('jd.png', ''),
    ]);
    expect(errors).toEqual([]);
    expect(parts).toEqual([{ data: 'UEdO', mimeType: 'image/png' }]);
  });

  it('rejects unsupported file types', async () => {
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('jd.gif', 'image/gif'),
    ]);
    expect(parts).toEqual([]);
    expect(errors).toEqual(['jd.gif must be a JPEG, PNG, or WebP image.']);
  });

  it('rejects images larger than the base64 limit', async () => {
    results = [
      `data:image/jpeg;base64,${'A'.repeat(MAX_CV_IMAGE_BASE64_CHARS + 1)}`,
    ];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('big.jpg', 'image/jpeg'),
    ]);
    expect(parts).toEqual([]);
    expect(errors).toEqual(['big.jpg is too large.']);
  });

  it('caps the number of images at MAX_CV_IMAGES', async () => {
    results = Array.from({ length: MAX_CV_IMAGES + 2 }, () => jpegDataUrl);
    const files = Array.from({ length: MAX_CV_IMAGES + 2 }, (_, i) =>
      makeFile(`jd-${i}.jpg`, 'image/jpeg'),
    );
    const { parts, errors } = await readImagePartsFromFiles(files);
    expect(parts).toHaveLength(MAX_CV_IMAGES);
    expect(errors).toEqual([`You can attach up to ${MAX_CV_IMAGES} images.`]);
  });

  it('respects a custom maxImages option', async () => {
    results = Array.from({ length: 3 }, () => jpegDataUrl);
    const files = Array.from({ length: 3 }, (_, i) =>
      makeFile(`jd-${i}.jpg`, 'image/jpeg'),
    );
    const { parts, errors } = await readImagePartsFromFiles(files, {
      maxImages: 1,
    });
    expect(parts).toHaveLength(1);
    expect(errors).toEqual(['You can attach up to 1 images.']);
  });

  it('surfaces a read error for unreadable files', async () => {
    results = [new Error('read failed')];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('broken.jpg', 'image/jpeg'),
    ]);
    expect(parts).toEqual([]);
    expect(errors).toEqual(['Could not read broken.jpg.']);
  });
});
