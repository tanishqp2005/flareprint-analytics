'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DailyAnalyticsItem } from '@/types/analytics';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';
import { CalendarX } from 'lucide-react';

interface OrderDailyChartProps {
  data: DailyAnalyticsItem[];
  isLoading?: boolean;
}

export function OrderDailyChart({ data, isLoading }: OrderDailyChartProps) {
  const [metricTab, setMetricTab] = useState<'all' | 'revenue' | 'orders' | 'pages'>('all');

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs h-80 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600 mb-2.5" />
        <p className="text-xs text-slate-500 font-medium">Loading daily analytics telemetry...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200/80 shadow-2xs h-80 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
          <CalendarX className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">No Activity in Range</h4>
        <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
          No print jobs were recorded for the selected date window. Try selecting a broader time preset.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Daily Operational Velocity</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological aggregation of order volume, revenue generated, and printed sheet counts
          </p>
        </div>

        {/* Segmented Control Pill */}
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricTab('all')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              metricTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Metrics
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('revenue')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              metricTab === 'revenue'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('orders')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              metricTab === 'orders'
                ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setMetricTab('pages')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              metricTab === 'pages'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pages
          </button>
        </div>
      </div>

      <div className="h-68 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="formattedDate"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white text-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1.5 border border-slate-200/90 min-w-36">
                      <p className="font-semibold text-slate-900 pb-1 border-b border-slate-100">
                        {label}
                      </p>
                      {payload.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span className="capitalize text-slate-500">
                            {item.name}:
                          </span>
                          <span className="font-bold text-slate-900">
                            {item.name === 'Revenue'
                              ? formatCurrency(item.value as number)
                              : formatNumber(item.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 500 }}
            />

            {(metricTab === 'all' || metricTab === 'revenue') && (
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            )}
            {(metricTab === 'all' || metricTab === 'orders') && (
              <Area
                type="monotone"
                dataKey="orders"
                name="Orders"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOrders)"
              />
            )}
            {(metricTab === 'all' || metricTab === 'pages') && (
              <Area
                type="monotone"
                dataKey="pages"
                name="Pages Printed"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPages)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
