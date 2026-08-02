import { AI_PROVIDERS } from '@/lib/consts';
import { parseEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET() {
  const { apiKey, provider } = parseEnv();
  const defaultModel =
    AI_PROVIDERS.find((p) => p.value === provider)?.defaultModel ?? '';

  return Response.json({
    hasBundledKey: apiKey !== null,
    provider,
    defaultModel,
  });
}
