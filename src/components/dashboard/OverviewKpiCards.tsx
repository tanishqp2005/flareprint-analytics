'use client';

import React from 'react';
import {
  ShoppingBag,
  IndianRupee,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Layers,
  Cpu,
} from 'lucide-react';
import { OverviewMetrics } from '@/types/analytics';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

interface OverviewKpiCardsProps {
  metrics: OverviewMetrics;
  isLoading?: boolean;
}

export function OverviewKpiCards({ metrics, isLoading }: OverviewKpiCardsProps) {
  const primaryCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      subtext: 'From verified successful payments',
      icon: IndianRupee,
      valueColor: 'text-slate-900',
      iconContainer: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: formatNumber(metrics.totalOrders),
      subtext: 'Recorded in selected period',
      icon: ShoppingBag,
      valueColor: 'text-slate-900',
      iconContainer: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      title: 'Pages Printed',
      value: formatNumber(metrics.totalPages),
      subtext: 'Calculated as pages × copies',
      icon: FileText,
      valueColor: 'text-slate-900',
      iconContainer: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(metrics.avgOrderValue),
      subtext: 'Revenue divided by paid orders',
      icon: TrendingUp,
      valueColor: 'text-slate-900',
      iconContainer: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
  ];

  const secondaryCards = [
    {
      title: 'Paid Orders',
      value: formatNumber(metrics.paidOrders),
      subtext: 'Payment status: Completed',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Completed Prints',
      value: formatNumber(metrics.completedPrints),
      subtext: 'Fulfillment status: Completed',
      icon: Layers,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Avg Pages / Order',
      value: formatNumber(metrics.avgPagesPerOrder),
      subtext: 'Average job page density',
      icon: FileText,
      iconColor: 'text-slate-600',
    },
    {
      title: 'Cancelled Orders',
      value: formatNumber(metrics.cancelledOrders),
      subtext: metrics.cancelledOrders > 0 ? 'Action required' : 'No cancellations',
      icon: XCircle,
      iconColor: metrics.cancelledOrders > 0 ? 'text-rose-600' : 'text-slate-400',
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {primaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.iconContainer}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                {isLoading ? (
                  <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
                ) : (
                  <div className={`text-2xl font-bold tracking-tight ${card.valueColor}`}>
                    {card.value}
                  </div>
                )}
                <div className="mt-1 text-xs text-slate-400 font-normal">
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secondaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-slate-500 truncate">
                  {card.title}
                </div>
                {isLoading ? (
                  <div className="h-5 w-12 bg-slate-100 animate-pulse rounded mt-0.5" />
                ) : (
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {card.value}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {card.subtext}
                </div>
              </div>
              <Icon className={`w-4 h-4 ${card.iconColor} flex-shrink-0`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
