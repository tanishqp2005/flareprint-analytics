'use client';

import React from 'react';
import {
  Wifi,
  WifiOff,
  Clock,
  Activity,
  Cpu,
  Monitor,
} from 'lucide-react';
import { KioskStatusSummary, KioskPerformanceItem } from '@/types/analytics';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils/formatters';

interface KioskStatusSectionProps {
  summary: KioskStatusSummary;
  kiosks: KioskPerformanceItem[];
  isLoading?: boolean;
}

export function KioskStatusSection({ summary, kiosks, isLoading }: KioskStatusSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-18 bg-slate-50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const getDbStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            DB: Active
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            DB: Idle
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            DB: Online
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            DB: {status || 'Offline'}
          </span>
        );
    }
  };

  const getConnectionBadge = (indicator: 'online' | 'stale') => {
    if (indicator === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Online (&lt;5m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Heartbeat Stale
      </span>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Kiosk Operations Fleet</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              {summary.totalKiosks} Discovered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitors dual-channel telemetry: Realtime database state and 5-minute heartbeat health
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <Cpu className="w-3.5 h-3.5 text-orange-600" />
          <span>Active Nodes: {summary.connectedHeartbeats} / {summary.totalKiosks}</span>
        </div>
      </div>

      {/* Fleet Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-950 tracking-tight">{summary.connectedHeartbeats}</div>
            <div className="text-[11px] font-semibold text-emerald-700">Heartbeat Online</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200/70 text-slate-600">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.staleHeartbeats}</div>
            <div className="text-[11px] font-semibold text-slate-600">Heartbeat Stale</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-950 tracking-tight">{summary.byDbStatus['active'] || 0}</div>
            <div className="text-[11px] font-semibold text-blue-700">DB Printing / Active</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-950 tracking-tight">{summary.byDbStatus['idle'] || 0}</div>
            <div className="text-[11px] font-semibold text-amber-700">DB Idle / Ready</div>
          </div>
        </div>
      </div>

      {/* Physical Kiosk Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kiosks.map((kiosk) => {
          const isLive = kiosk.connectionIndicator === 'online';
          return (
            <div
              key={kiosk.id}
              className={`p-5 rounded-xl border transition-all ${
                isLive
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {kiosk.kiosk_code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                      {kiosk.display_name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>Location: {kiosk.location || 'Unspecified'}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {getConnectionBadge(kiosk.connectionIndicator)}
                  {getDbStatusBadge(kiosk.status)}
                </div>
              </div>

              {/* Operational Metrics in selected range */}
              <div className="grid grid-cols-3 gap-2 py-3.5 border-b border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Revenue</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatCurrency(kiosk.revenue)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Paid Jobs</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatNumber(kiosk.paidOrders)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Pages</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatNumber(kiosk.pagesPrinted)}
                  </div>
                </div>
              </div>

              {/* Card Footer: Heartbeat and completion */}
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last telemetry: <strong className="font-semibold text-slate-700">{formatRelativeTime(kiosk.last_heartbeat)}</strong>
                </span>

                <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 text-[11px]">
                  {formatNumber(kiosk.paidOrders)} paid jobs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
