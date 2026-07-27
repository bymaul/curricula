import { HarvardTemplate } from '@/components/resume/HarvardTemplate';
import { toast } from '@/components/ui/toast';
import { SECTIONS } from '@/lib/consts';
import { CVData } from '@/lib/schema';
import { useUIStore } from '@/store/useUIStore';
import { Document, Page, pdf } from '@react-pdf/renderer';
import { UseFormReturn } from 'react-hook-form';

export const useCVPdf = (cvData: CVData, methods: UseFormReturn<CVData>) => {
    const setActiveTab = useUIStore((state) => state.setActiveTab);

    const handleDownloadPdf = async () => {
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

        const generatePdf = async () => {
            const blob = await pdf(
                <Document style={{ fontFamily: 'Times-Roman' }}>
                    <Page size='A4' style={{ padding: '2cm' }}>
                        <HarvardTemplate cvData={cvData} isPdf={true} />
                    </Page>
                </Document>,
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${cvData.name ? cvData.name.replace(/\s+/g, '_') + `_CV` : 'My_CV'}.pdf`;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return true;
        };

        toast.promise(generatePdf(), {
            loading: 'Generating perfect PDF...',
            success: 'PDF Downloaded successfully!',
            error: 'Failed to generate PDF.',
        });
    };

    return { handleDownloadPdf };
};
