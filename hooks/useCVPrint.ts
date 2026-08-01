import { toast } from '@/components/ui/toast';
import { SECTIONS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';

export function useCVPrint(cvData: CVData, methods: UseFormReturn<CVData>) {
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const printRef = useRef<HTMLDivElement>(null);

  const executePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${cvData.name || 'My'} - ${cvData.jobTitle} - CV`,
  });

  const focusFirstInvalidSection = () => {
    const errorKeys = Object.keys(methods.formState.errors) as (keyof CVData)[];
    if (errorKeys.length === 0) return null;

    const firstErrorField = errorKeys[0];
    const targetSection = SECTIONS.find((section) =>
      section.fields.includes(firstErrorField),
    );
    const targetTab = targetSection?.name ?? 'Personal';

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
        title: 'Validation Error',
        description: `Please fix the errors in the ${targetTab} section before printing your CV.`,
      });
      return;
    }

    executePrint();
  };

  return { printRef, handlePrintClick };
}
