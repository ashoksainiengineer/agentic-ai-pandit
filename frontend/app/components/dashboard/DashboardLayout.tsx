/**
 * DashboardLayout Component
 * Main layout structure for dashboard pages with sidebar and header
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Activity,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigation = [
  { name: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Readings', href: '/admin/readings', icon: Activity },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href || pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--prism-canvas)] flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[rgba(0,0,0,0.08)] transform transition-transform duration-200 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[rgba(0,0,0,0.08)]">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#000000] to-[#000000] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className=" text-xl font-medium text-black">
              AI Pandit
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#000000]/10 text-black'
                    : 'text-[#636363] hover:bg-[#ffffff] hover:text-black'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#000000]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ffffff]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#000000] to-[#000000] flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-[#636363] truncate">
                {user?.email || 'app.aipandit@gmail.com'}
              </p>
            </div>
            <button className="p-2 rounded-lg hover:bg-[rgba(0,0,0,0.08)]/50 text-[#636363] hover:text-black transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[rgba(0,0,0,0.08)] flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              aria-label="Open sidebar"
              className="lg:hidden p-2 rounded-lg hover:bg-[#ffffff] text-[#636363]"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-2 text-sm">
              <Link href="/admin/dashboard" className="text-[#636363] hover:text-black">
                Dashboard
              </Link>
              {pathname !== '/admin/dashboard' && pathname !== '/admin' && (
                <>
                  <ChevronRight className="w-4 h-4 text-[#D0CBC5]" />
                  <span className="text-black font-medium capitalize">
                    {pathname.split('/').pop()?.replace('-', ' ')}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-[#ffffff] text-[#636363] transition-colors">
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
