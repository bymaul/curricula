'use client';

import { useEffect, useRef } from 'react';

interface UsePinchZoomOptions {
    scale: number;
    minScale: number;
    maxScale: number;
    onZoomChange: (scale: number) => void;
}

export function usePinchZoom<T extends HTMLElement>({ scale, minScale, maxScale, onZoomChange }: UsePinchZoomOptions) {
    const containerRef = useRef<T>(null);
    const startRef = useRef<{ distance: number; scale: number } | null>(null);
    const scaleRef = useRef(scale);
    const optionsRef = useRef({ minScale, maxScale, onZoomChange });

    useEffect(() => {
        optionsRef.current = { minScale, maxScale, onZoomChange };
    });

    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const distance = (touches: TouchList) => {
            const [a, b] = [touches[0], touches[1]];
            return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        };

        const clamp = (value: number) => {
            const { minScale, maxScale } = optionsRef.current;
            return Math.min(maxScale, Math.max(minScale, value));
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                startRef.current = { distance: distance(e.touches), scale: scaleRef.current };
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && startRef.current) {
                e.preventDefault();
                const next = startRef.current.scale * (distance(e.touches) / startRef.current.distance);
                optionsRef.current.onZoomChange(+(clamp(next)).toFixed(2));
            }
        };

        const handleTouchEnd = () => {
            startRef.current = null;
        };

        const handleWheel = (e: WheelEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            e.preventDefault();
            const factor = Math.exp(-e.deltaY * 0.01);
            optionsRef.current.onZoomChange(+(clamp(scaleRef.current * factor)).toFixed(2));
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);
        el.addEventListener('touchcancel', handleTouchEnd);
        el.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
            el.removeEventListener('touchcancel', handleTouchEnd);
            el.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return { containerRef };
}
