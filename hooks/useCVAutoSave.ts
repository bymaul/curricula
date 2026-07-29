import { CVData, cvSchema } from '@/lib/schema';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export function useCVAutoSave(methods: UseFormReturn<CVData>) {
    const [mounted, setMounted] = useState(false);
    const { watch, reset } = methods;

    const cvData = watch();

    useEffect(() => {
        const savedData = localStorage.getItem('cv-builder-data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                const validationResult = cvSchema.safeParse(parsed);
                if (validationResult.success) {
                    reset(validationResult.data);
                } else {
                    console.warn('Stored CV data schema mismatch, falling back to initial state.');
                }
            } catch (e) {
                console.error('Failed to parse local storage', e);
            }
        }
        setMounted(true);
    }, [reset]);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('cv-builder-data', JSON.stringify(cvData));
        }
    }, [cvData, mounted]);

    return { mounted, cvData };
}
