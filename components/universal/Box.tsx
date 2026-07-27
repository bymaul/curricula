import React from 'react';
import { View } from '@react-pdf/renderer';
import { tw } from '@/lib/pdf-tailwind';

interface BoxProps {
    isPdf?: boolean;
    className?: string;
    children?: React.ReactNode;
    wrap?: boolean;
}

export const Box = ({ isPdf, className = '', children, wrap = true }: BoxProps) => {
    if (isPdf) {
        return (
            <View style={className ? tw(className) : undefined} wrap={wrap}>
                {children}
            </View>
        );
    }

    const webClassName = `${className} ${!wrap ? 'break-inside-avoid' : ''}`.trim();
    return <div className={webClassName}>{children}</div>;
};
