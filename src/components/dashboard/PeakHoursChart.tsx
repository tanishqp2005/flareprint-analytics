'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HourlyVolumeItem } from '@/types/analytics';
import { formatNumber, formatCurrency } from '@/lib/utils/formatters';
import { Clock } from 'lucide-react';

interface PeakHoursChartProps {
  data: HourlyVolumeItem[];
  isLoading?: boolean;
}

export function PeakHoursChart({ data, isLoading }: PeakHoursChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs h-80 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-orange-200 border-t-orange-600 mb-3" />
        <p className="text-xs text-slate-500 font-medium">Computing 24-hour peak pattern...</p>
      </div>
    );
  }

  // Find peak hour
  const maxOrders = data.reduce((max, item) => Math.max(max, item.orders), 0);
  const peakHourItem = data.find((item) => item.orders === maxOrders && maxOrders > 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Hourly Demand Curve</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            24-hour chronological distribution of customer traffic and order fulfillment (00:00 – 23:00 IST)
          </p>
        </div>
        {peakHourItem ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>Peak Window: <strong>{peakHourItem.hour} IST</strong> ({peakHourItem.orders} orders)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-500 self-start sm:self-auto">
            <span>Even distribution across day</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={2}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as HourlyVolumeItem;
                  return (
                    <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800 min-w-32">
                      <p className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
                        Time: {item.hour} IST
                      </p>
                      <div className="flex justify-between gap-4">
                        <span className="text-orange-400">Paid Jobs:</span>
                        <span className="font-bold text-white">{formatNumber(item.orders)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-emerald-400">Revenue:</span>
                        <span className="font-bold text-white">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="orders"
              name="Paid Orders"
              fill="#ea580c"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
