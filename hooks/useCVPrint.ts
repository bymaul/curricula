import { toast } from '@/components/ui/toast';
import { SECTIONS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { useRef } from 'react';
import { UseFormReturn, FieldErrors } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';

function getTabWithFirstError(errors: FieldErrors<CVData>): string | undefined {
    return SECTIONS.find(({ fields }) => fields.some((field) => errors[field]))?.name;
}

export function useCVPrint(cvData: CVData, methods: UseFormReturn<CVData>, setActiveTab: (tab: string) => void) {
    const printRef = useRef<HTMLDivElement>(null);

    const executePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `${cvData.name || 'My'}_CV`,
    });

    const handlePrintClick = async () => {
        const isValid = await methods.trigger();

        if (!isValid) {
            toast.add({
                type: 'warning',
                title: 'Validation Error',
                description: 'Please fill out all required fields before generating the PDF.',
            });

            const errorTab = getTabWithFirstError(methods.formState.errors);
            if (errorTab) setActiveTab(errorTab);

            return;
        }

        executePrint();
    };

    return { printRef, handlePrintClick };
}
