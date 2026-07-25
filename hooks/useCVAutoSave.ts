import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CVData } from '@/lib/schema';

export function useCVAutoSave(methods: UseFormReturn<CVData>) {
    const [mounted, setMounted] = useState(false);
    const { watch, reset } = methods;

    const cvData = watch();

    useEffect(() => {
        const savedData = localStorage.getItem('cv-builder-data');
        if (savedData) {
            try {
                reset(JSON.parse(savedData));
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
