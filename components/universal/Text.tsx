import React from 'react';
import { Text as PdfText } from '@react-pdf/renderer';
import { tw } from '@/lib/pdf-tailwind';

interface TextProps {
    isPdf?: boolean;
    className?: string;
    children: React.ReactNode;
    block?: boolean;
}

export const Text = ({ isPdf, className = '', children, block = false }: TextProps) => {
    if (isPdf) {
        return <PdfText style={className ? tw(className) : undefined}>{children}</PdfText>;
    }
    const Tag = block ? 'div' : 'span';
    return <Tag className={className}>{children}</Tag>;
};
