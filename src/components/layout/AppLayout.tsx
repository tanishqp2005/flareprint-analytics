'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Menu } from 'lucide-react';
import Image from 'next/image';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/flareprint-logo.png"
            alt="FlarePrint"
            width={140}
            height={42}
            className="h-8 w-auto object-contain mb-4 animate-pulse"
            priority
          />
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        </div>
        <h2 className="text-xs font-semibold text-slate-700">Verifying Admin Privileges</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Connecting to FlarePrint Operations</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1.5">Unauthorized Access</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            The account <strong className="text-slate-900 font-semibold">{user.email}</strong> is authenticated,
            but is not enrolled in the FlarePrint administrator whitelist.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              Sign In with Authorized Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7FAFC]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile top bar with brand logo */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Image
              src="/flareprint-logo.png"
              alt="FlarePrint"
              width={110}
              height={32}
              className="h-6 w-auto object-contain"
            />
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
