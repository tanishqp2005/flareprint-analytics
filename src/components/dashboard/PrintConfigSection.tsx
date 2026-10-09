'use client';

import React from 'react';
import { PrintConfigMetrics } from '@/types/analytics';
import { formatNumber } from '@/lib/utils/formatters';

interface PrintConfigSectionProps {
  metrics: PrintConfigMetrics;
  isLoading?: boolean;
}

export function PrintConfigSection({ metrics, isLoading }: PrintConfigSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-72 animate-pulse space-y-4">
        <div className="h-5 w-40 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-slate-50 rounded-lg" />
          <div className="h-40 bg-slate-50 rounded-lg" />
        </div>
      </div>
    );
  }

  const totalColorBw = metrics.bwOrders + metrics.colorOrders;
  const bwPercent = totalColorBw > 0 ? Math.round((metrics.bwOrders / totalColorBw) * 100) : 0;
  const colorPercent = totalColorBw > 0 ? 100 - bwPercent : 0;

  const totalSides = metrics.singleSidedOrders + metrics.doubleSidedOrders;
  const singlePercent = totalSides > 0 ? Math.round((metrics.singleSidedOrders / totalSides) * 100) : 0;
  const doublePercent = totalSides > 0 ? 100 - singlePercent : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Print Mode Preferences</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Proportional split of customer print selections between color palette and paper orientation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Color Mode */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Color Balance</h4>
              <span className="text-[11px] font-semibold text-slate-500">
                {formatNumber(totalColorBw)} orders
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex mb-4">
              <div
                style={{ width: `${bwPercent}%` }}
                className="bg-slate-800 h-full transition-all duration-500"
                title={`B&W: ${bwPercent}%`}
              />
              <div
                style={{ width: `${colorPercent}%` }}
                className="bg-orange-500 h-full transition-all duration-500"
                title={`Color: ${colorPercent}%`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mt-1 flex-shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-medium">B&W (Monochrome)</div>
                <div className="text-base font-extrabold text-slate-900">
                  {formatNumber(metrics.bwOrders)}{' '}
                  <span className="text-xs font-normal text-slate-500">({bwPercent}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1 flex-shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Color Print</div>
                <div className="text-base font-extrabold text-slate-900">
                  {formatNumber(metrics.colorOrders)}{' '}
                  <span className="text-xs font-normal text-slate-500">({colorPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Paper Sides */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Duplex Layout</h4>
              <span className="text-[11px] font-semibold text-slate-500">
                {formatNumber(totalSides)} orders
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex mb-4">
              <div
                style={{ width: `${singlePercent}%` }}
                className="bg-blue-600 h-full transition-all duration-500"
                title={`Single-sided: ${singlePercent}%`}
              />
              <div
                style={{ width: `${doublePercent}%` }}
                className="bg-teal-500 h-full transition-all duration-500"
                title={`Double-sided: ${doublePercent}%`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Single-sided</div>
                <div className="text-base font-extrabold text-slate-900">
                  {formatNumber(metrics.singleSidedOrders)}{' '}
                  <span className="text-xs font-normal text-slate-500">({singlePercent}%)</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500 mt-1 flex-shrink-0" />
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Double-sided (Duplex)</div>
                <div className="text-base font-extrabold text-slate-900">
                  {formatNumber(metrics.doubleSidedOrders)}{' '}
                  <span className="text-xs font-normal text-slate-500">({doublePercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
