'use client';

/**
 * AI Pandit - Shared Layout Component
 * Design System — Light Theme
 */

import React from 'react';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('./Navbar'), { ssr: false });
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  hideNavbar?: boolean;
  hideFooter?: boolean;
  transparentNavbar?: boolean;
}

export default function Layout({
  children,
  className = '',
  fullWidth = false,
  hideNavbar = false,
  hideFooter = false,
  transparentNavbar = false,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] text-black flex flex-col">

      {/* Navigation */}
      {!hideNavbar && <Navbar transparent={transparentNavbar} />}

      {/* Main Content */}
      <main className={`flex-1 relative z-10 ${className}`}>
        {fullWidth ? (
          children
        ) : (
          <div className="max-w-[1200px] mx-auto px-6">
            {children}
          </div>
        )}
      </main>

      {/* Footer */}
      {!hideFooter && <Footer />}
    </div>
  );
}

/**
 * Alternative layout variant for centered content (auth pages, etc.)
 */
export function CenteredLayout({
  children,
  className = '',
  hideNavbar = false,
  hideFooter = false,
}: Omit<LayoutProps, 'fullWidth'>) {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] text-black flex flex-col relative">
      {!hideNavbar && <Navbar />}

      <main className={`flex-1 flex items-center justify-center p-4 relative z-10 ${className}`}>
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}

/**
 * Dashboard layout variant with sidebar support
 */
export function DashboardLayout({
  children,
  className = '',
  sidebar,
}: {
  children: React.ReactNode;
  className?: string;
  sidebar?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] text-black flex flex-col relative">
      <Navbar />

      <div className="flex-1 flex relative z-10">
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-black/5 bg-white">
            {sidebar}
          </aside>
        )}

        <main className={`flex-1 ${className}`}>
          <div className="max-w-[1200px] mx-auto px-6">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
