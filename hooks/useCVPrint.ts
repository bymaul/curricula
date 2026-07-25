import { useRef } from 'react';
import { UseFormTrigger } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';
import { CVData } from '@/lib/schema';
import { toast } from '@/components/ui/toast';

export function useCVPrint(cvData: CVData, trigger: UseFormTrigger<CVData>, setActiveTab: (tab: string) => void) {
    const printRef = useRef<HTMLDivElement>(null);

    const executePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `${cvData.name || 'My'}_CV`,
    });

    const handlePrintClick = async () => {
        const isValid = await trigger();

        if (!isValid) {
            toast.add({
                type: 'warning',
                description: 'Please fill out all required fields before generating the PDF.',
            });
            // UX Bonus: You can inspect `methods.formState.errors` here
            // and call setActiveTab('Education') if an education field is missing!
            return;
        }

        executePrint();
    };

    return { printRef, handlePrintClick };
}
