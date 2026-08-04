import { MAX_CV_IMAGE_BASE64_CHARS, MAX_CV_IMAGES } from '@/lib/cvParsing';
import type { CVImagePart } from '@/lib/cvParsing';

export const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

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
      const match = result.match(/^data:[^;]*;base64,(.+)$/);
      if (match) resolve(match[1]);
      else reject(new Error('Unreadable image file'));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Unreadable image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Reads image files (JPEG/PNG/WebP) into base64 `CVImagePart`s for the AI
 * vision pipeline, enforcing the same limits as the parse-CV route.
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
      const data = await fileToDataUrl(file);
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
