import { useRef } from 'react';
import { UseFormReset } from 'react-hook-form';
import { CVData, cvSchema } from '@/lib/schema';
import { toast } from '@/components/ui/toast';

export function useCVImportExport(cvData: CVData, reset: UseFormReset<CVData>) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportData = () => {
        const dataStr = JSON.stringify(cvData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cvData.name ? cvData.name.replace(/\s+/g, '_') : 'My'}_CV_Data.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedJson = JSON.parse(event.target?.result as string);
                const validationResult = cvSchema.safeParse(parsedJson);

                if (!validationResult.success) {
                    console.error('Validation errors:', validationResult.error);
                    toast.add({
                        type: 'error',
                        description: 'Invalid CV format. The file is corrupted or from an older version.',
                        priority: 'high',
                    });
                    return;
                }

                reset(validationResult.data);

                toast.add({
                    type: 'success',
                    description: 'CV Data imported successfully!',
                });
            } catch (error) {
                toast.add({
                    type: 'error',
                    description: 'Could not read file. Please upload a valid JSON backup.',
                    priority: 'high',
                });
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return { fileInputRef, handleExportData, handleImportData };
}
