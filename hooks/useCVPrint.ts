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
        documentTitle: `${cvData.name || 'My'}_CV`,
    });

    const handlePrintClick = async () => {
        const isValid = await methods.trigger();

        if (!isValid) {
            const errors = methods.formState.errors;
            const errorKeys = Object.keys(errors) as (keyof CVData)[];

            if (errorKeys.length > 0) {
                const firstErrorField = errorKeys[0];
                const targetSection = SECTIONS.find((section) => section.fields.includes(firstErrorField));
                const targetTab = targetSection ? targetSection.name : 'Personal';

                setActiveTab(targetTab);

                toast.add({
                    type: 'warning',
                    title: 'Validation Error',
                    description: `Please fix the errors in the ${targetTab} section before exporting.`,
                });

                return;
            }
        }

        executePrint();
    };

    return { printRef, handlePrintClick };
}
