'use client';

import React from 'react';
import { KioskPerformanceItem } from '@/types/analytics';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils/formatters';
import { Monitor } from 'lucide-react';

interface KioskPerformanceTableProps {
  kiosks: KioskPerformanceItem[];
  isLoading?: boolean;
}

export function KioskPerformanceTable({ kiosks, isLoading }: KioskPerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-50 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Online
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Active
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Idle
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Offline
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Kiosk Asset Comparative Performance</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Breakdown of order volume, revenue yield, completed jobs, and average ticket size across machines
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Kiosk Code</th>
              <th className="py-3 px-4">Display Name</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">DB Status</th>
              <th className="py-3 px-4">Heartbeat</th>
              <th className="py-3 px-4">Last Seen</th>
              <th className="py-3 px-4 text-right">Paid Jobs</th>
              <th className="py-3 px-4 text-right">Pages</th>
              <th className="py-3 px-4 text-right">Revenue</th>
              <th className="py-3 px-4 text-right">Avg Ticket (AOV)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {kiosks.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">No Kiosks Registered</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">No kiosks were found in the database.</div>
                </td>
              </tr>
            ) : (
              kiosks.map((kiosk) => (
                <tr key={kiosk.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-900">
                      {kiosk.kiosk_code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {kiosk.display_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {kiosk.location || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(kiosk.status)}
                  </td>
                  <td className="py-3.5 px-4">
                    {kiosk.connectionIndicator === 'online' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Stale
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatRelativeTime(kiosk.last_heartbeat)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatNumber(kiosk.paidOrders)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatNumber(kiosk.pagesPrinted)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                    {formatCurrency(kiosk.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                    {formatCurrency(kiosk.avgOrderValue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
