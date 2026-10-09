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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/flareprint-logo.png"
            alt="FlarePrint"
            width={160}
            height={48}
            className="h-9 w-auto object-contain mb-4 animate-pulse"
            priority
          />
          <div className="w-7 h-7 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-3" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">Verifying Admin Privileges</h2>
        <p className="text-xs text-slate-400 mt-0.5">Connecting to FlarePrint Operations</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-rose-200 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">Unauthorized Access</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            The account <strong className="text-slate-900 font-semibold">{user.email}</strong> is authenticated,
            but is not enrolled in the FlarePrint administrator whitelist.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
            >
              Sign In with Authorized Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile top bar with brand logo */}
        <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Image
              src="/flareprint-logo.png"
              alt="FlarePrint"
              width={110}
              height={32}
              className="h-6 w-auto object-contain"
            />
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
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
