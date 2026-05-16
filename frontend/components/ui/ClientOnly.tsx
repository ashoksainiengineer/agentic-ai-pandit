'use client';

import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * An industry-standard component to prevent Next.js hydration mismatches.
 * 
 * This component ensures that its children are only rendered on the client-side,
 * after the component has successfully mounted. This is the canonical way to
 * handle content that relies on client-specific data, such as window size,
 * local storage, or, in this case, the user's local timezone.
 *
 * @param {ReactNode} children The content to be rendered only on the client.
 * @param {ReactNode} [fallback=null] A placeholder to be rendered on the server and during initial client render.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return <>{children}</>;
}
