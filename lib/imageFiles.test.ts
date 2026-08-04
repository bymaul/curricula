import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_CV_IMAGE_BASE64_CHARS, MAX_CV_IMAGES } from '@/lib/cvParsing';
import { readImagePartsFromFiles } from '@/lib/imageFiles';

const JPEG_OUTPUT = 'data:image/jpeg;base64,SlBH';

interface FileReaderLike {
  result: string | ArrayBuffer | null;
  error: Error | null;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  readAsDataURL(file: File): void;
}

let readResults: Array<string | Error> = [];
let readCount = 0;
let decodeFails = false;
let canvasDims: Array<{ width: number; height: number }> = [];

class FakeFileReader implements FileReaderLike {
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL() {
    readCount += 1;
    const next = readResults[readCount - 1];
    if (next instanceof Error) {
      this.error = next;
      this.onerror?.();
    } else {
      this.result = next;
      this.onload?.();
    }
  }
}

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 4000;
  naturalHeight = 3000;
  set src(_value: string) {
    if (decodeFails) this.onerror?.();
    else this.onload?.();
  }
  get src() {
    return '';
  }
}

function makeCanvas() {
  const ctx = {
    drawImage: () => {},
  };
  const canvas = {
    width: 0,
    height: 0,
    toDataURL: () => JPEG_OUTPUT,
    getContext: (kind: string) => (kind === '2d' ? ctx : null),
  };
  return new Proxy(canvas, {
    set(target, key, value) {
      Reflect.set(target, key, value);
      if (key === 'height') {
        canvasDims.push({ width: target.width, height: target.height });
      }
      return true;
    },
  });
}

const makeFile = (name: string, type: string) =>
  ({ name, type }) as unknown as File;

const jpegDataUrl = 'data:image/jpeg;base64,QUJD';

beforeEach(() => {
  readResults = [];
  readCount = 0;
  decodeFails = false;
  canvasDims = [];
  globalThis.FileReader = FakeFileReader as unknown as typeof FileReader;
  globalThis.Image = FakeImage as unknown as typeof Image;
  globalThis.document = {
    createElement: () => makeCanvas(),
  } as unknown as typeof document;
});

afterEach(() => {
  delete (globalThis as { FileReader?: unknown }).FileReader;
  delete (globalThis as { Image?: unknown }).Image;
  delete (globalThis as { document?: unknown }).document;
});

describe('readImagePartsFromFiles', () => {
  it('downscales a large image to a JPEG part', async () => {
    readResults = [jpegDataUrl];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('jd.jpg', 'image/jpeg'),
    ]);
    expect(errors).toEqual([]);
    expect(parts).toEqual([{ data: 'SlBH', mimeType: 'image/jpeg' }]);
  });

  it('caps the total pixel count of tall screenshots', async () => {
    globalThis.Image = class extends FakeImage {
      naturalWidth = 1200;
      naturalHeight = 8000;
    } as unknown as typeof Image;
    readResults = [jpegDataUrl];
    await readImagePartsFromFiles([makeFile('jd.png', 'image/png')]);
    const { width, height } = canvasDims[0];
    expect(width * height).toBeLessThanOrEqual(1_500_000);
    expect(width).toBeLessThan(1200);
  });

  it('falls back to the original data when the image cannot be decoded', async () => {
    decodeFails = true;
    readResults = [jpegDataUrl];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('jd.png', 'image/png'),
    ]);
    expect(errors).toEqual([]);
    expect(parts).toEqual([{ data: 'QUJD', mimeType: 'image/png' }]);
  });

  it('rejects undecodable images that exceed the base64 limit', async () => {
    decodeFails = true;
    readResults = [
      `data:image/jpeg;base64,${'A'.repeat(MAX_CV_IMAGE_BASE64_CHARS + 1)}`,
    ];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('big.jpg', 'image/jpeg'),
    ]);
    expect(parts).toEqual([]);
    expect(errors).toEqual(['big.jpg is too large.']);
  });

  it('rejects unsupported file types', async () => {
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('jd.gif', 'image/gif'),
    ]);
    expect(parts).toEqual([]);
    expect(errors).toEqual(['jd.gif must be a JPEG, PNG, or WebP image.']);
  });

  it('caps the number of images at MAX_CV_IMAGES', async () => {
    readResults = Array.from({ length: MAX_CV_IMAGES + 2 }, () => jpegDataUrl);
    const files = Array.from({ length: MAX_CV_IMAGES + 2 }, (_, i) =>
      makeFile(`jd-${i}.jpg`, 'image/jpeg'),
    );
    const { parts, errors } = await readImagePartsFromFiles(files);
    expect(parts).toHaveLength(MAX_CV_IMAGES);
    expect(errors).toEqual([`You can attach up to ${MAX_CV_IMAGES} images.`]);
  });

  it('respects a custom maxImages option', async () => {
    readResults = Array.from({ length: 3 }, () => jpegDataUrl);
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
    readResults = [new Error('read failed')];
    const { parts, errors } = await readImagePartsFromFiles([
      makeFile('broken.jpg', 'image/jpeg'),
    ]);
    expect(parts).toEqual([]);
    expect(errors).toEqual(['Could not read broken.jpg.']);
  });
});
