'use client';

import { SectionFieldArray } from './shared';

export const SkillsForm = () => (
  <SectionFieldArray
    name="skills"
    title="Skills"
    description="Group your technical and soft skills by category for ATS readability."
    addLabel="Add Skill Category"
    variant="row"
    removeTitle="Remove Skill Category"
    newItem={() => ({ category: '', items: '' })}
    fields={[
      {
        name: 'category',
        className: 'w-1/3',
        label: 'Category',
        placeholder: 'Languages',
      },
      {
        name: 'items',
        className: 'flex-1',
        label: 'Skills',
        placeholder: 'TypeScript, Python, SQL...',
      },
    ]}
  />
);
