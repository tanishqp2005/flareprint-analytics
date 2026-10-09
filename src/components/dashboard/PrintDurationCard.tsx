'use client';

import React from 'react';
import { Timer, Zap, Gauge } from 'lucide-react';
import { PrintDurationMetrics } from '@/types/analytics';
import { formatDuration, formatNumber } from '@/lib/utils/formatters';

interface PrintDurationCardProps {
  metrics: PrintDurationMetrics;
  isLoading?: boolean;
}

export function PrintDurationCard({ metrics, isLoading }: PrintDurationCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-72 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Print Execution Latency</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical print duration telemetry benchmarked from completed hardware sessions (completed_at − started_at)
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <span>{formatNumber(metrics.completedSessionsCount)} Benchmark Samples</span>
        </div>
      </div>

      {/* 3 Telemetry Speed Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Mean Duration
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatDuration(metrics.overallAvgSeconds)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Fastest Job
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatDuration(metrics.overallMinSeconds)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex-shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Longest Job
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {formatDuration(metrics.overallMaxSeconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Kiosk Table */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
          Per-Machine Telemetry Distribution
        </h4>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Kiosk Code</th>
                <th className="py-2.5 px-3">Hardware Node</th>
                <th className="py-2.5 px-3 text-right">Job Samples</th>
                <th className="py-2.5 px-3 text-right">Average Speed</th>
                <th className="py-2.5 px-3 text-right">Fastest</th>
                <th className="py-2.5 px-3 text-right">Slowest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metrics.byKiosk.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                    No hardware session execution logs recorded for this period.
                  </td>
                </tr>
              ) : (
                metrics.byKiosk.map((k) => (
                  <tr key={k.kiosk_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {k.kiosk_code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {k.display_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {formatNumber(k.sessionCount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                      {formatDuration(k.avgDurationSeconds)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-medium">
                      {formatDuration(k.minDurationSeconds)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-purple-700 font-medium">
                      {formatDuration(k.maxDurationSeconds)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
