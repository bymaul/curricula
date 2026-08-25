import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { SECTIONS, SectionId, TabName } from '@/lib/consts';
import { tabKey } from '@/lib/i18n';
import type { CVData } from '@/lib/schema';
import { useResumeStore } from '@/store/useResumeStore';
import { useUIStore } from '@/store/useUIStore';
import { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';

export function useCVPrint(methods: UseFormReturn<CVData>) {
  const { t } = useI18n();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const printRef = useRef<HTMLDivElement>(null);
  const activeResume = useResumeStore((state) =>
    state.resumes.find((r) => r.id === state.activeId),
  );

  const executePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: t('print.documentTitle', {
      name: activeResume?.data.name || t('common.my'),
      jobTitle: activeResume?.data.jobTitle ?? '',
    }),
  });

  const focusFirstInvalidSection = (): TabName | null => {
    const errorKeys = Object.keys(methods.formState.errors) as (keyof CVData)[];
    if (errorKeys.length === 0) return null;

    const firstErrorField = errorKeys[0];
    const targetSection = SECTIONS.find((section) =>
      section.fields.includes(firstErrorField),
    );
    let targetTab: TabName = targetSection?.name ?? 'personal';
    if (!targetSection && firstErrorField === 'customSections') {
      const customId = Object.values(
        activeResume?.data.customSections ?? {},
      ).find((s) => s.items.length > 0)?.id;
      if (customId) targetTab = customId as SectionId;
    }

    setActiveTab(targetTab);
    return targetTab;
  };

  const handlePrintClick = async () => {
    const isValid = await methods.trigger();

    if (!isValid) {
      const targetTab = focusFirstInvalidSection();
      if (!targetTab) return;

      toast.add({
        type: 'warning',
        title: t('editor.validationError'),
        description: t('editor.validationErrorDescription', {
          section:
            activeResume?.data.customSections?.[targetTab]?.title ??
            (tabKey(targetTab) ? t(tabKey(targetTab)!) : ''),
        }),
      });
      return;
    }

    executePrint();
  };

  return { printRef, handlePrintClick };
}
