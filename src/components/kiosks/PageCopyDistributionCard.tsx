'use client';

import React from 'react';
import { PageCopyDistribution } from '@/types/analytics';
import { formatNumber } from '@/lib/utils/formatters';
import { FileText, Copy, Layers } from 'lucide-react';

interface PageCopyDistributionCardProps {
  distribution: PageCopyDistribution;
  totalOrders: number;
  isLoading?: boolean;
}

export function PageCopyDistributionCard({
  distribution,
  totalOrders,
  isLoading,
}: PageCopyDistributionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-72 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded" />
        <div className="h-40 bg-slate-50 rounded-lg" />
      </div>
    );
  }

  const calcPct = (val: number) => {
    if (totalOrders <= 0) return 0;
    return Math.round((val / totalOrders) * 100);
  };

  const pageBuckets = [
    { label: 'Single Page (1)', count: distribution.singlePageOrders, pct: calcPct(distribution.singlePageOrders), color: 'bg-emerald-500' },
    { label: 'Small (2–5 pages)', count: distribution.smallJobOrders, pct: calcPct(distribution.smallJobOrders), color: 'bg-blue-500' },
    { label: 'Medium (6–10 pages)', count: distribution.mediumJobOrders, pct: calcPct(distribution.mediumJobOrders), color: 'bg-purple-500' },
    { label: 'Large (11+ pages)', count: distribution.largeJobOrders, pct: calcPct(distribution.largeJobOrders), color: 'bg-indigo-600' },
  ];

  const singleCopyPct = calcPct(distribution.singleCopyOrders);
  const multiCopyPct = calcPct(distribution.multiCopyOrders);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Page & Copy Volume Density</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Breakdown of job length distribution and multi-copy printing frequency
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Page Count Buckets */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Job Size Distribution</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {formatNumber(totalOrders)} Paid Orders
              </span>
            </div>

            {/* Segmented bar */}
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex mb-4">
              {pageBuckets.map((b, i) => (
                <div
                  key={i}
                  style={{ width: `${b.pct}%` }}
                  className={`${b.color} h-full transition-all duration-500`}
                  title={`${b.label}: ${b.pct}%`}
                />
              ))}
            </div>

            <div className="space-y-2 pt-1">
              {pageBuckets.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${b.color}`} />
                    <span className="text-slate-600 font-medium">{b.label}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {formatNumber(b.count)} <span className="text-slate-400 font-normal">({b.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copy Multipliers */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Multiplier Ratio</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Avg {distribution.avgCopies} Copies/Job
              </span>
            </div>

            {/* Segmented bar */}
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex mb-4">
              <div
                style={{ width: `${singleCopyPct}%` }}
                className="bg-teal-500 h-full transition-all duration-500"
                title={`Single Copy: ${singleCopyPct}%`}
              />
              <div
                style={{ width: `${multiCopyPct}%` }}
                className="bg-indigo-500 h-full transition-all duration-500"
                title={`Multiple Copies: ${multiCopyPct}%`}
              />
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="text-slate-600 font-medium">Single Copy (1 copy)</span>
                </div>
                <div className="font-bold text-slate-900">
                  {formatNumber(distribution.singleCopyOrders)}{' '}
                  <span className="text-slate-400 font-normal">({singleCopyPct}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 font-medium">Multiple Copies (&gt;1 copy)</span>
                </div>
                <div className="font-bold text-slate-900">
                  {formatNumber(distribution.multiCopyOrders)}{' '}
                  <span className="text-slate-400 font-normal">({multiCopyPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Mean Copies Ratio:</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {distribution.avgCopies} copies/order
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
