/**
 * Breadcrumbs Component
 * Navigation breadcrumbs for deep page hierarchy
 * Follows Sacred Ivory design system
 */

import Link from 'next/link';
import { ReactNode, memo } from 'react';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
  /** Display label for the breadcrumb */
  label: string;
  /** URL for navigation (undefined for current page) */
  href?: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Optional custom separator */
  separator?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
}

/**
 * Default separator component
 */
function DefaultSeparator() {
  return (
    <ChevronRight className="w-4 h-4 text-[#D0CBC5] flex-shrink-0" />
  );
}

/**
 * Breadcrumbs navigation component
 * 
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/', icon: Home },
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Analysis' }
 *   ]}
 * />
 * ```
 */
export const Breadcrumbs = memo(function Breadcrumbs({
  items,
  separator,
  className = '',
  showHomeIcon = true,
}: BreadcrumbsProps) {
  const Separator = separator || <DefaultSeparator />;
  return (
    <nav 
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm ${className}`}
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => {
          const _isLast = index === items.length - 1;
          const Icon = item.icon;
          const isFirst = index === 0;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && Separator}
              
              {item.href ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-[#636363] hover:text-black transition-colors"
                >
                  {isFirst && showHomeIcon && !Icon && (
                    <Home className="w-4 h-4" />
                  )}
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span 
                  className="flex items-center gap-1.5 text-black font-medium"
                  aria-current="page"
                >
                  {isFirst && showHomeIcon && !Icon && (
                    <Home className="w-4 h-4" />
                  )}
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

/**
 * Predefined breadcrumb configurations for common pages
 */
export const predefinedBreadcrumbs = {
  /** Analysis progress page breadcrumbs */
  analysis: (sessionId?: string): BreadcrumbItem[] => [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard' },
    { label: sessionId ? `Analysis ${sessionId.slice(0, 8)}...` : 'Analysis' },
  ],

  /** Analysis results page breadcrumbs */
  results: (sessionId?: string): BreadcrumbItem[] => [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard' },
    { label: sessionId ? `Analysis ${sessionId.slice(0, 8)}...` : 'Analysis', href: sessionId ? `/rectify/${sessionId}` : undefined },
    { label: 'Results' },
  ],

  /** Dashboard page breadcrumbs */
  dashboard: (): BreadcrumbItem[] => [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard' },
  ],

  /** Rectify form page breadcrumbs */
  rectify: (): BreadcrumbItem[] => [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'New Analysis' },
  ],

  /** Privacy page breadcrumbs */
  privacy: (): BreadcrumbItem[] => [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Privacy Policy' },
  ],

  /** Terms page breadcrumbs */
  terms: (): BreadcrumbItem[] => [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Terms of Service' },
  ],
};
