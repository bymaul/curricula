import { CVData } from './schema';

export type BuiltinSectionId =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications';

export type SectionId = BuiltinSectionId | (string & {});

export const RENDERABLE_SECTIONS: {
  id: BuiltinSectionId;
  title: string;
}[] = [
  { id: 'summary', title: 'Summary' },
  { id: 'experience', title: 'Experience' },
  { id: 'projects', title: 'Projects' },
  { id: 'education', title: 'Education' },
  { id: 'skills', title: 'Skills' },
  { id: 'certifications', title: 'Certifications' },
];

export type BuiltinTabName =
  'personal' | 'design' | Exclude<BuiltinSectionId, 'summary'>;

export type TabName = BuiltinTabName | (string & {});

export const getSectionTabName = (sectionId: SectionId): TabName => {
  if (sectionId === 'summary') return 'personal';
  return sectionId;
};

export const getSectionIdFromTab = (tab: string): SectionId | null => {
  if (tab === 'personal') return 'summary';
  const builtin = RENDERABLE_SECTIONS.find((section) => section.id === tab);
  return builtin ? builtin.id : tab;
};

export const DEFAULT_SECTION_ORDER: SectionId[] = RENDERABLE_SECTIONS.map(
  (s) => s.id,
);

export const SECTION_IDS: SectionId[] = RENDERABLE_SECTIONS.map((s) => s.id);

export const SECTIONS: { name: TabName; fields: (keyof CVData)[] }[] = [
  {
    name: 'personal',
    fields: [
      'name',
      'jobTitle',
      'email',
      'phone',
      'location',
      'links',
      'summary',
    ],
  },
  { name: 'experience', fields: ['experience'] },
  { name: 'projects', fields: ['projects'] },
  { name: 'education', fields: ['education'] },
  { name: 'skills', fields: ['skills'] },
  { name: 'certifications', fields: ['certifications'] },
];
