import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  LucideIcon,
  User,
  Wrench,
} from 'lucide-react';
import { CVData } from './schema';

export const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-5.6-luna' },
    { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-haiku-4-5' },
    { value: 'google', label: 'Google', defaultModel: 'gemini-3-flash-preview' },
] as const;

export const AI_API_KEY_STORAGE_KEY = 'curricula-ai-api-key';

export const getStoredAIAPIKey = () =>
    sessionStorage.getItem(AI_API_KEY_STORAGE_KEY)?.trim() || '';

export type AIProvider = (typeof AI_PROVIDERS)[number]['value'];

export const SECTIONS: { name: string; icon: LucideIcon; fields: (keyof CVData)[] }[] = [
  {
    name: 'Personal',
    icon: User,
    fields: ['name', 'jobTitle', 'email', 'phone', 'location', 'links', 'summary'],
  },
  { name: 'Experience', icon: Briefcase, fields: ['experience'] },
  { name: 'Projects', icon: FolderGit2, fields: ['projects'] },
  { name: 'Education', icon: GraduationCap, fields: ['education'] },
  { name: 'Skills', icon: Wrench, fields: ['skills'] },
  { name: 'Certifications', icon: Award, fields: ['certifications'] },
];
