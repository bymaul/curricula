'use client';

import { cn } from '@/lib/utils';
import { Eye, Pencil } from 'lucide-react';

interface MobileViewToggleProps {
    value: 'edit' | 'preview';
    onChange: (view: 'edit' | 'preview') => void;
}

const OPTIONS = [
    { value: 'edit', label: 'Edit', icon: Pencil },
    { value: 'preview', label: 'Preview', icon: Eye },
] as const;

export function MobileViewToggle({ value, onChange }: MobileViewToggleProps) {
    return (
        <div className='lg:hidden shrink-0 px-4 pt-4 pb-2 print:hidden'>
            <div className='grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg'>
                {OPTIONS.map(({ value: v, label, icon: Icon }) => (
                    <button
                        key={v}
                        type='button'
                        onClick={() => onChange(v)}
                        className={cn(
                            'flex items-center justify-center gap-1.5 h-10 rounded-md text-sm font-semibold transition-colors',
                            value === v ? 'bg-foreground shadow-sm text-primary-foreground' : 'text-muted-foreground',
                        )}>
                        <Icon className='w-3.5 h-3.5' />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
