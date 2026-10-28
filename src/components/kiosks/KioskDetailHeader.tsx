'use client';

import React from 'react';
import Link from 'next/link';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters';
import {
  ArrowLeft,
  RotateCw,
  MapPin,
  Clock,
  Radio,
  Server,
} from 'lucide-react';

interface KioskDetailHeaderProps {
  kiosk: {
    kiosk_code: string;
    display_name: string;
    location: string;
    status: string;
    last_heartbeat: string | null;
    connectionIndicator: 'online' | 'stale';
    connectionLabel: string;
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function KioskDetailHeader({
  kiosk,
  onRefresh,
  isRefreshing,
}: KioskDetailHeaderProps) {
  const isOnline = kiosk.connectionIndicator === 'online';

  const getDbStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            DB: Active
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            DB: Idle
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            DB: Online
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            DB: {status || 'Offline'}
          </span>
        );
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Breadcrumb back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/kiosks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Kiosks</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Scoped Machine Dashboard</span>
          </div>
        </div>

        {/* Main Header Info Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-white shadow-2xs">
                {kiosk.kiosk_code}
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {kiosk.display_name}
              </h1>
            </div>

            <div className="flex items-center gap-3.5 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location: <strong>{kiosk.location || 'Unspecified'}</strong>
              </span>

              <span className="text-slate-300">•</span>

              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last Heartbeat: <strong>{formatRelativeTime(kiosk.last_heartbeat)}</strong>
                {kiosk.last_heartbeat && (
                  <span className="text-[11px] text-slate-400">
                    ({formatDateTime(kiosk.last_heartbeat)})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Right Status Badges & Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Separate Database Status Indicator */}
            {getDbStatusBadge(kiosk.status)}

            {/* Separate Heartbeat Connectivity Indicator */}
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Heartbeat Online (&lt;5m)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Heartbeat Stale
              </span>
            )}

            {/* Date Range Picker */}
            <DateRangePicker />

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Machine Telemetry"
                className="inline-flex items-center justify-center p-2 text-slate-600 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
