import { useRef } from 'react';
import { UseFormReset } from 'react-hook-form';
import { CVData } from '@/lib/schema';

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
                const importedData = JSON.parse(event.target?.result as string);
                reset(importedData);

                alert('CV Data imported successfully!');
            } catch (error) {
                alert('Invalid JSON file. Please upload a valid CV Data backup.');
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return { fileInputRef, handleExportData, handleImportData };
}
