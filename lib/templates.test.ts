import { describe, expect, it } from 'vitest';
import { TEMPLATE_COMPONENTS } from '@/components/resume/registry';
import { DICTIONARIES } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { TEMPLATES, TEMPLATE_IDS } from '@/lib/templates';

type TemplateNameKey = keyof (typeof DICTIONARIES)['en']['templates'];

describe('template registry coherence', () => {
  it('has a render component for every template id', () => {
    for (const id of TEMPLATE_IDS) {
      expect(TEMPLATE_COMPONENTS, id).toHaveProperty(id);
    }
  });

  it('has no component registered without a template id', () => {
    const componentIds = Object.keys(TEMPLATE_COMPONENTS);
    for (const id of componentIds) {
      expect(TEMPLATE_IDS, id).toContain(id);
    }
  });

  it('has a display name in every locale for every template', () => {
    for (const locale of Object.keys(DICTIONARIES) as Language[]) {
      for (const { id } of TEMPLATES) {
        const name = DICTIONARIES[locale].templates[id as TemplateNameKey].name;
        expect(name, `${locale}.templates.${id}.name`).toBeTruthy();
      }
    }
  });
});
