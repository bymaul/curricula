import { z } from 'zod';
import { CVData, cvDataStoredSchema } from '@/lib/schema';
import { ResumeLanguage } from '@/lib/i18n/languages';
import { RESUME_LANGUAGES } from '@/lib/i18n/languages';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS, TemplateId } from '@/lib/templates';

const SHARE_PREFIX_V2 = 'c2:';
const LEGACY_SHARE_PREFIX = 'c1:';

const CHUNK = 0x8000;

const shareEnvelopeSchema = z.object({
  v: z.literal(2),
  language: z.enum(RESUME_LANGUAGES).default('en'),
  photo: z.string().default(''),
  template: z.enum(TEMPLATE_IDS).default(DEFAULT_TEMPLATE_ID),
  data: cvDataStoredSchema,
});

export interface ShareResult {
  data: CVData;
  language: ResumeLanguage;
  photo: string;
  template: TemplateId;
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlToBytes(payload: string): Uint8Array<ArrayBuffer> {
  let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function legacyResult(data: CVData): ShareResult {
  return { data, language: 'en', photo: '', template: DEFAULT_TEMPLATE_ID };
}

export type ShareOptions = {
  language?: ResumeLanguage;
  photo?: string;
  template?: TemplateId;
};

export async function buildSharePayload(
  data: CVData,
  options: ShareOptions = {},
): Promise<string> {
  const envelope = {
    v: 2,
    language: options.language ?? 'en',
    photo: options.photo ?? '',
    template: options.template ?? DEFAULT_TEMPLATE_ID,
    data,
  };
  const stream = new Blob([JSON.stringify(envelope)])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return SHARE_PREFIX_V2 + bytesToBase64url(compressed);
}

export async function parseSharePayload(
  payload: string,
): Promise<ShareResult | null> {
  try {
    let json: string;
    if (payload.startsWith(SHARE_PREFIX_V2)) {
      const bytes = base64urlToBytes(payload.slice(SHARE_PREFIX_V2.length));
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      json = await new Response(stream).text();
      const parsed = JSON.parse(json);
      const result = shareEnvelopeSchema.safeParse(parsed);
      return result.success
        ? {
            data: result.data.data,
            language: result.data.language,
            photo: result.data.photo,
            template: result.data.template,
          }
        : null;
    }
    if (payload.startsWith(LEGACY_SHARE_PREFIX)) {
      const bytes = base64urlToBytes(payload.slice(LEGACY_SHARE_PREFIX.length));
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      json = await new Response(stream).text();
    } else {
      json = new TextDecoder().decode(base64urlToBytes(payload));
    }
    const parsed = JSON.parse(json);
    const result = cvDataStoredSchema.safeParse(parsed);
    return result.success ? legacyResult(result.data) : null;
  } catch {
    return null;
  }
}

export async function buildShareUrl(
  data: CVData,
  options: ShareOptions = {},
): Promise<string> {
  const payload = await buildSharePayload(data, options);
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#resume=${payload}`;
}
