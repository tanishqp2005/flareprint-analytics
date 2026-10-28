'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Monitor,
  Printer,
  Settings,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navLinks = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
      active: pathname.startsWith('/orders'),
    },
    {
      name: 'Kiosks',
      href: '/kiosks',
      icon: Monitor,
      active: pathname.startsWith('/kiosks'),
    },
    {
      name: 'Print Analytics',
      href: '/print-analytics',
      icon: Printer,
      active: pathname.startsWith('/print-analytics'),
    },
  ];

  const bottomLinks = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-700 border-r border-slate-200 select-none">
      {/* Brand Header with Logo & Admin Badge */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex flex-col gap-1 group">
          <div className="flex items-center gap-2">
            <Image
              src="/flareprint-logo.png"
              alt="FlarePrint"
              width={130}
              height={38}
              className="h-7 w-auto object-contain transition-opacity group-hover:opacity-90"
              priority
            />
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
              Admin
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium pl-0.5">
            Operations Analytics
          </span>
        </Link>

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Configuration
          </div>
          <nav className="space-y-1">
            {bottomLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        {user && (
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {user.email}
                </div>
                <div className="text-[10px] text-blue-600 font-medium">
                  Authorized Admin
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 flex-shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <aside className="relative flex-1 flex flex-col max-w-xs w-full h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
