'use client';

import React from 'react';
import {
  ShoppingBag,
  IndianRupee,
  FileText,
  TrendingUp,
  Layers,
  CheckCircle2,
  XCircle,
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
      subtext: 'From verified paid orders',
      icon: IndianRupee,
      accentColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      badge: 'Financial',
    },
    {
      title: 'Total Orders',
      value: formatNumber(metrics.totalOrders),
      subtext: 'Created in selected period',
      icon: ShoppingBag,
      accentColor: 'text-slate-900',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
      badge: 'Volume',
    },
    {
      title: 'Total Pages Printed',
      value: formatNumber(metrics.totalPages),
      subtext: 'Calculated as pages × copies',
      icon: FileText,
      accentColor: 'text-slate-900',
      iconBg: 'bg-orange-50 text-orange-700 border border-orange-100',
      badge: 'Physical Output',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(metrics.avgOrderValue),
      subtext: 'Revenue divided by paid orders',
      icon: TrendingUp,
      accentColor: 'text-slate-900',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
      badge: 'Efficiency',
    },
  ];

  const secondaryCards = [
    {
      title: 'Paid Orders',
      value: formatNumber(metrics.paidOrders),
      subtext: 'payment_status = completed',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Completed Prints',
      value: formatNumber(metrics.completedPrints),
      subtext: 'order status = completed',
      icon: Layers,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Avg Pages / Order',
      value: formatNumber(metrics.avgPagesPerOrder),
      subtext: 'Average job size density',
      icon: FileText,
      iconColor: 'text-slate-600',
    },
    {
      title: 'Cancelled Orders',
      value: formatNumber(metrics.cancelledOrders),
      subtext: 'order status = cancelled',
      icon: XCircle,
      iconColor: metrics.cancelledOrders > 0 ? 'text-rose-600' : 'text-slate-400',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Primary KPI Row (Dominate) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.iconBg} transition-transform group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                {isLoading ? (
                  <div className="h-9 w-28 bg-slate-100 animate-pulse rounded-md" />
                ) : (
                  <div className={`text-3xl font-extrabold tracking-tight ${card.accentColor}`}>
                    {card.value}
                  </div>
                )}
                <div className="mt-1.5 text-xs text-slate-400 font-medium">
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-white/80 rounded-lg border border-slate-200/90 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between"
            >
              <div className="min-w-0 pr-2">
                <div className="text-[11px] font-medium text-slate-500 truncate">
                  {card.title}
                </div>
                {isLoading ? (
                  <div className="h-6 w-12 bg-slate-100 animate-pulse rounded mt-1" />
                ) : (
                  <div className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                    {card.value}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {card.subtext}
                </div>
              </div>

              <div className="p-2 rounded-md bg-slate-50 border border-slate-100 flex-shrink-0">
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
