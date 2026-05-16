import { useState, useEffect, RefObject } from 'react';

export function useResponsiveColumns(containerRef: RefObject<HTMLDivElement | null>, defaultColumns: number = 4) {
    const [columns, setColumns] = useState(defaultColumns);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = new ResizeObserver((resizeEntries) => {
            const width = resizeEntries[0]?.contentRect.width || 0;
            if (width >= 1024) setColumns(4);
            else if (width >= 768) setColumns(3);
            else setColumns(2);
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [containerRef]);

    return columns;
}
