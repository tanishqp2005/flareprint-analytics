'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import {
  Database,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Server,
  KeyRound,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qqqkhaotsdfliebbdypr.supabase.co';

  return (
    <AppLayout>
      <Header
        title="Settings & System Topology"
        description="Active administrative credentials, database schema bindings, and deployment parameters"
        showDatePicker={false}
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Administrator Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Administrator Profile</h3>
                <p className="text-xs text-slate-500">Authenticated administrative session credentials</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Verified Session
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Email Identity
              </div>
              <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                {user?.email || 'admin@sakec.ac.in'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Privilege Level
              </div>
              <div className="font-bold text-emerald-700 text-sm mt-0.5">
                Super Administrator
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-rose-200/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out of Session
            </button>
          </div>
        </div>

        {/* Supabase Database Connection */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Supabase Production Integration</h3>
              <p className="text-xs text-slate-500">Live cloud database connection &amp; schema bindings</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-2">
              <span className="font-semibold text-slate-600">Database Project Endpoint:</span>
              <span className="font-mono text-slate-900 font-medium text-xs bg-white px-2 py-1 rounded border border-slate-200">
                {supabaseUrl}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2.5">
                Connected Core Schema Tables:
              </span>
              <ul className="space-y-2 text-slate-600 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <code className="font-mono text-xs font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-900">public.orders</code>
                    <span className="text-slate-500 ml-1.5">— Order logs, transaction prices, document metadata, and kiosk attribution</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <code className="font-mono text-xs font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-900">public.kiosks</code>
                    <span className="text-slate-500 ml-1.5">— Hardware kiosk machines, display aliases, and live telemetry heartbeats</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <code className="font-mono text-xs font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-900">public.kiosk_sessions</code>
                    <span className="text-slate-500 ml-1.5">— Physical print execution timing for duration benchmarks</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security & Access Architecture */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Security &amp; Token Architecture</h3>
              <p className="text-xs text-slate-500">Zero browser service-role exposure policy</p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              FlarePrint Analytics uses a server-side <strong>Backend-for-Frontend (BFF)</strong> security model.
              All administrative database access is conducted exclusively through authenticated Next.js API routes,
              preventing service-role credentials from ever reaching client browsers.
            </p>
            <p className="text-slate-500">
              Anonymous kiosk print sessions are created under a dedicated Supabase Auth service identity, ensuring zero customer session leakage.
            </p>
          </div>
        </div>

        {/* System Deployment Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
            <Server className="w-4 h-4 text-orange-600" />
            <span>FlarePrint Analytics — Operations Control Center</span>
          </div>
          <div className="text-xs text-slate-500">
            Internal operations application. Completely segregated from customer store and kiosk endpoints.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
