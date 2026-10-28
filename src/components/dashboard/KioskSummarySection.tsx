'use client';

import React from 'react';
import Link from 'next/link';
import { KioskPerformanceItem } from '@/types/analytics';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import {
  Trophy,
  ArrowRight,
  Monitor,
  CheckCircle2,
  AlertCircle,
  MapPin,
  TrendingUp,
} from 'lucide-react';

interface KioskSummarySectionProps {
  kiosks: KioskPerformanceItem[];
  isLoading?: boolean;
}

export function KioskSummarySection({ kiosks, isLoading }: KioskSummarySectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Find best-performing kiosk by revenue (or jobs if revenue is 0)
  const sortedByRevenue = [...kiosks].sort((a, b) => b.revenue - a.revenue || b.paidOrders - a.paidOrders);
  const bestKiosk = sortedByRevenue.length > 0 && (sortedByRevenue[0].revenue > 0 || sortedByRevenue[0].paidOrders > 0)
    ? sortedByRevenue[0]
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Kiosk Fleet Performance Summary</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {kiosks.length} Nodes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet-wide hardware summary with quick-access links to dedicated machine analytics
          </p>
        </div>

        <Link
          href="/kiosks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200/60 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>View Kiosks Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Best Performing Kiosk Spotlight Card */}
        <div className="lg:col-span-1 p-5 rounded-xl border border-blue-100 bg-blue-50/20 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Trophy className="w-3.5 h-3.5 text-blue-600" />
                Top Performer
              </span>
              {bestKiosk && (
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                  {bestKiosk.kiosk_code}
                </span>
              )}
            </div>

            {bestKiosk ? (
              <>
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  {bestKiosk.display_name}
                </h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 mb-3.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{bestKiosk.location || 'Location unspecified'}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 text-center my-2.5">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-medium text-slate-500">Revenue</div>
                    <div className="text-base font-bold text-emerald-600 mt-0.5">
                      {formatCurrency(bestKiosk.revenue)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                    <div className="text-[10px] font-medium text-slate-500">Paid Jobs</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      {formatNumber(bestKiosk.paidOrders)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                <TrendingUp className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                <p className="font-medium text-slate-600">No Revenue Data in Window</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All machines recorded 0 paid orders for this period.</p>
              </div>
            )}
          </div>

          {bestKiosk && (
            <Link
              href={`/kiosks/${bestKiosk.kiosk_code}`}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <span>Open Dedicated Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Fleet Machines Quick Overview */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kiosks.map((kiosk) => {
            const isOnline = kiosk.connectionIndicator === 'online';
            return (
              <div
                key={kiosk.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                          {kiosk.kiosk_code}
                        </span>
                        <div className="flex items-center gap-1 text-[11px]">
                          {isOnline ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              Stale
                            </span>
                          )}
                        </div>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 mt-1 truncate max-w-[180px]">
                        {kiosk.display_name}
                      </h5>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {formatCurrency(kiosk.revenue)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {kiosk.paidOrders} paid jobs
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Pages Printed</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {formatNumber(kiosk.pagesPrinted)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Completion Rate</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {kiosk.paidOrders > 0
                          ? `${Math.round((kiosk.completedPrints / kiosk.paidOrders) * 100)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/kiosks/${kiosk.kiosk_code}`}
                  className="w-full inline-flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-700 pt-2 border-t border-slate-100 transition-colors group cursor-pointer"
                >
                  <span>Machine Telemetry</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
