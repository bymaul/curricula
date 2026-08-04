import { MAX_CV_IMAGE_BASE64_CHARS, MAX_CV_IMAGES } from '@/lib/cvParsing';
import type { CVImagePart } from '@/lib/cvParsing';

export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_SCAN_WIDTH = 1200;
export const MAX_TOTAL_PIXELS = 1_500_000;
export const JPEG_QUALITY = 0.75;

export interface ReadImageFilesResult {
  parts: CVImagePart[];
  errors: string[];
}

function inferMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return '';
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:')) {
        reject(new Error('Unreadable image file'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Unreadable image file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Undecodable image'));
    image.src = dataUrl;
  });
}

/**
 * Downscales an image to a JPEG at most `MAX_SCAN_WIDTH` pixels wide, keeping
 * uploaded job description images small enough for thumbnails and the AI
 * request payload. Returns null when the source cannot be decoded.
 */
export async function downscaleImage(dataUrl: string): Promise<string | null> {
  try {
    const image = await loadImage(dataUrl);
    const scale = Math.min(
      2,
      MAX_SCAN_WIDTH / image.naturalWidth,
      // Vision models slow down sharply on multi-megapixel inputs (a full-page
      // job posting screenshot can be several thousand pixels tall), so cap
      // the total pixel count to keep the AI call within the function limit.
      Math.sqrt(
        MAX_TOTAL_PIXELS /
          Math.max(1, image.naturalWidth * image.naturalHeight),
      ),
    );
    const width = Math.max(1, Math.floor(image.naturalWidth * scale));
    const height = Math.max(1, Math.floor(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    return null;
  }
}

/**
 * Reads image files (JPEG/PNG/WebP) into base64 `CVImagePart`s for the AI
 * vision pipeline, downscaling each to a JPEG so real-world screenshots stay
 * within the parse-CV payload limits.
 */
export async function readImagePartsFromFiles(
  files: FileList | readonly File[],
  options?: { maxImages?: number },
): Promise<ReadImageFilesResult> {
  const maxImages = options?.maxImages ?? MAX_CV_IMAGES;
  const parts: CVImagePart[] = [];
  const errors: string[] = [];

  for (const file of Array.from(files)) {
    const mimeType = inferMimeType(file);
    if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      errors.push(`${file.name} must be a JPEG, PNG, or WebP image.`);
      continue;
    }
    if (parts.length >= maxImages) {
      errors.push(`You can attach up to ${maxImages} images.`);
      break;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const downscaled = await downscaleImage(dataUrl);
      if (downscaled) {
        const match = downscaled.match(/^data:image\/jpeg;base64,(.+)$/);
        if (match) {
          parts.push({ data: match[1], mimeType: 'image/jpeg' });
          continue;
        }
      }
      const data = dataUrl.replace(/^data:[^;]*;base64,/, '');
      if (data.length > MAX_CV_IMAGE_BASE64_CHARS) {
        errors.push(`${file.name} is too large.`);
        continue;
      }
      parts.push({ data, mimeType });
    } catch {
      errors.push(`Could not read ${file.name}.`);
    }
  }

  return { parts, errors };
}
