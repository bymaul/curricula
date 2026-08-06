import { toast } from '@/components/ui/toast';
import { useI18n } from '@/components/I18nProvider';
import { SECTIONS, TabName } from '@/lib/consts';
import { TAB_KEYS } from '@/lib/i18n';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';

export function useCVPrint(cvData: CVData, methods: UseFormReturn<CVData>) {
  const { t } = useI18n();
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const printRef = useRef<HTMLDivElement>(null);

  const executePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: t('print.documentTitle', {
      name: cvData.name || t('common.my'),
      jobTitle: cvData.jobTitle,
    }),
  });

  const focusFirstInvalidSection = (): TabName | null => {
    const errorKeys = Object.keys(methods.formState.errors) as (keyof CVData)[];
    if (errorKeys.length === 0) return null;

    const firstErrorField = errorKeys[0];
    const targetSection = SECTIONS.find((section) =>
      section.fields.includes(firstErrorField),
    );
    const targetTab: TabName = targetSection?.name ?? 'personal';

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
          section: t(TAB_KEYS[targetTab]),
        }),
      });
      return;
    }

    executePrint();
  };

  return { printRef, handlePrintClick };
}
