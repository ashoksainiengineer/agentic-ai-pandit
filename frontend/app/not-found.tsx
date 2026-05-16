/**
 * Not Found Page (404)
 * Custom error page for unmatched routes
 * Follows Light Theme design system
 */

import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Home, 
  Search, 
  ArrowRight, 
  Compass,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found | AI Pandit',
  description: 'The page you are looking for could not be found. Navigate back to AI Pandit birth time rectification.',
};

/**
 * Navigation link configuration for 404 page
 */
const navigationLinks = [
  {
    href: '/',
    label: 'Return Home',
    description: 'Back to landing page',
    icon: Home,
    variant: 'primary' as const,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'View your analyses',
    icon: LayoutDashboard,
    variant: 'secondary' as const,
  },
  {
    href: '/rectify',
    label: 'Start Analysis',
    description: 'Begin new BTR session',
    icon: Sparkles,
    variant: 'secondary' as const,
  },
];

/**
 * SVG Illustration component for 404 page
 * Represents a lost compass/astrological theme
 */
function NotFoundIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8">
      {/* Outer ring */}
      <svg 
        viewBox="0 0 200 200" 
        aria-hidden="true"
        className="w-full h-full animate-spin text-black/8"
        style={{ animationDuration: '20s' }}
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
      
      {/* Inner compass */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-white border-2 border-black/8 flex items-center justify-center shadow-lg">
          <Compass className="w-16 h-16 text-black" strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Decorative dots */}
      <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-black/10" />
      <div className="absolute bottom-8 left-6 w-2 h-2 rounded-full bg-black/5" />
      <div className="absolute top-1/2 -right-2 w-2 h-2 rounded-full bg-black/5" />
    </div>
  );
}

/**
 * Primary CTA Link component
 */
interface CTALinkProps {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary';
}

function CTALink({ href, label, description, icon: Icon, variant }: CTALinkProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
        ${isPrimary 
          ? 'bg-black text-white border-transparent shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 hover:-translate-y-0.5' 
          : 'bg-white border-black/8 hover:border-black/20 hover:bg-[var(--prism-canvas)]'
        }
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center transition-colors
        ${isPrimary ? 'bg-white/20' : 'bg-[var(--prism-canvas)] group-hover:bg-white'}
      `}>
        <Icon className={`w-6 h-6 ${isPrimary ? 'text-white' : 'text-black'}`} />
      </div>
      
      <div className="flex-1">
        <div className={`font-medium ${isPrimary ? 'text-white' : 'text-black'}`}>
          {label}
        </div>
        <div className={`text-sm ${isPrimary ? 'text-white/80' : 'text-black/60'}`}>
          {description}
        </div>
      </div>
      
      <ArrowRight className={`
        w-5 h-5 transition-transform group-hover:translate-x-1
        ${isPrimary ? 'text-white/80' : 'text-black'}
      `} />
    </Link>
  );
}

/**
 * Search suggestion component
 * Provides quick links to common destinations
 */
function SearchSuggestions() {
  const suggestions = [
    { label: 'Birth Time Rectification', href: '/rectify' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  return (
    <div className="mt-8 pt-8 border-t border-black/8">
      <div className="flex items-center gap-2 text-black/60 mb-4">
        <Search className="w-4 h-4" />
        <span className="text-sm">Popular pages</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Link
            key={suggestion.href}
            href={suggestion.href}
            className="px-4 py-2 text-sm text-black/60 bg-white border border-black/8 rounded-full hover:border-black/20 hover:text-black transition-colors"
          >
            {suggestion.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Main 404 Page Component
 */
export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[var(--prism-canvas)] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        {/* Illustration */}
        <NotFoundIllustration />
        
        {/* Error Code */}
        <div className="text-center mb-2">
          <span className="text-8xl font-light text-black/8 select-none">
            404
          </span>
        </div>
        
        {/* Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-black mb-2">
            Page Not Found
          </h1>
          <p className="text-black/60">
            The page you are looking for seems to have wandered into another constellation.
          </p>
        </div>
        
        {/* Navigation Options */}
        <div className="space-y-3">
          {navigationLinks.map((link) => (
            <CTALink key={link.href} {...link} />
          ))}
        </div>
        
        {/* Search Suggestions */}
        <SearchSuggestions />
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-black/40">
            If you believe this is an error, please contact{' '}
            <a 
              href="mailto:app.aipandit@gmail.com" 
              className="text-black hover:underline"
            >
              app.aipandit@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
