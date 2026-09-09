export const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-5.6-luna' },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-haiku-4-5' },
  { value: 'google', label: 'Google', defaultModel: 'gemini-3-flash-preview' },
] as const;

export const AI_API_KEY_STORAGE_KEY = 'curricula-ai-api-key';

export const getStoredAIAPIKey = () =>
  localStorage.getItem(AI_API_KEY_STORAGE_KEY)?.trim() || '';

export type AIProvider = (typeof AI_PROVIDERS)[number]['value'];

export const AI_ADJUST_SCOPES = [
  { value: 'full', label: 'Entire CV' },
  { value: 'summary', label: 'Summary' },
  { value: 'experience', label: 'Experience' },
  { value: 'projects', label: 'Projects' },
  { value: 'education', label: 'Education' },
  { value: 'skills', label: 'Skills' },
] as const;

export type AIAdjustScope = (typeof AI_ADJUST_SCOPES)[number]['value'];
