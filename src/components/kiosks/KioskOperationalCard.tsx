'use client';

import React from 'react';
import { KioskOperationalTelemetry } from '@/types/analytics';
import { formatNumber, formatDateTime, formatRelativeTime, formatDuration } from '@/lib/utils/formatters';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Clock,
  Timer,
  Info,
} from 'lucide-react';

interface KioskOperationalCardProps {
  operational: KioskOperationalTelemetry;
  isLoading?: boolean;
}

export function KioskOperationalCard({ operational, isLoading }: KioskOperationalCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-80 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-slate-50 rounded-lg" />
          <div className="h-20 bg-slate-50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">Operational Fulfillment & Latency</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time print fulfillment pipeline status, hardware execution state, and telemetry availability
        </p>
      </div>

      {/* Fulfillment Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Completed prints */}
        <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-teal-950 tracking-tight">
              {formatNumber(operational.completedJobs)}
            </div>
            <div className="text-[11px] font-semibold text-teal-700">Completed Prints</div>
          </div>
        </div>

        {/* Cancelled jobs */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatNumber(operational.cancelledJobs)}
            </div>
            <div className="text-[11px] font-semibold text-slate-600">Cancelled Jobs</div>
          </div>
        </div>

        {/* Processing orders */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-blue-950 tracking-tight">
              {formatNumber(operational.processingOrders)}
            </div>
            <div className="text-[11px] font-semibold text-blue-700">Currently Processing</div>
          </div>
        </div>

        {/* Paid Pending Physical Print */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-950 tracking-tight">
              {formatNumber(operational.paidPendingPrintOrders)}
            </div>
            <div className="text-[11px] font-semibold text-amber-700">Paid Awaiting Print</div>
          </div>
        </div>
      </div>

      {/* Latest Successful Print Timestamp */}
      <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-slate-700">Latest Successful Print Output:</span>
        </div>

        {operational.latestSuccessfulPrint ? (
          <div className="flex items-center gap-2 text-slate-800">
            <span className="font-bold text-slate-900">{formatRelativeTime(operational.latestSuccessfulPrint)}</span>
            <span className="text-slate-400">({formatDateTime(operational.latestSuccessfulPrint)})</span>
          </div>
        ) : (
          <span className="font-medium text-slate-400 italic">
            No completed print jobs recorded for this machine
          </span>
        )}
      </div>

      {/* Hardware Print Duration Telemetry Section */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Hardware Print Execution Duration
            </h4>
          </div>
          {operational.hasDurationTelemetry && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              {operational.durationSessionCount} Telemetry Benchmarks
            </span>
          )}
        </div>

        {operational.hasDurationTelemetry ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Average Duration</div>
              <div className="text-lg font-extrabold text-blue-700 mt-0.5">
                {formatDuration(operational.avgDurationSeconds)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Fastest Job</div>
              <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                {formatDuration(operational.minDurationSeconds)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Longest Job</div>
              <div className="text-lg font-extrabold text-purple-700 mt-0.5">
                {formatDuration(operational.maxDurationSeconds)}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Duration Telemetry Unavailable</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                No physical session start/completion benchmarks have been recorded for this machine in the selected time period. Metrics are strictly telemetry-derived and not estimated.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
