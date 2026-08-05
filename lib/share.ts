import { CVData, cvSchema } from '@/lib/schema';

const SHARE_PREFIX = 'c1:';

const CHUNK = 0x8000;

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

export async function buildSharePayload(data: CVData): Promise<string> {
  const stream = new Blob([JSON.stringify(data)])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return SHARE_PREFIX + bytesToBase64url(compressed);
}

export async function parseSharePayload(
  payload: string,
): Promise<CVData | null> {
  try {
    let json: string;
    if (payload.startsWith(SHARE_PREFIX)) {
      const bytes = base64urlToBytes(payload.slice(SHARE_PREFIX.length));
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      json = await new Response(stream).text();
    } else {
      json = new TextDecoder().decode(base64urlToBytes(payload));
    }
    const parsed = JSON.parse(json);
    const result = cvSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function buildShareUrl(data: CVData): Promise<string> {
  const payload = await buildSharePayload(data);
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#resume=${payload}`;
}
