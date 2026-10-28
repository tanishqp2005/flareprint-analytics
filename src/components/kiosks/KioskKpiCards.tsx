'use client';

import React from 'react';
import {
  IndianRupee,
  ShoppingBag,
  FileText,
  TrendingUp,
  CheckCircle2,
  Layers,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { OverviewMetrics, HistoricalComparisonMetrics, ComparisonDelta } from '@/types/analytics';
import { formatCurrency, formatNumber } from '@/lib/utils/formatters';

interface KioskKpiCardsProps {
  metrics: OverviewMetrics;
  historical?: HistoricalComparisonMetrics;
  isLoading?: boolean;
}

export function KioskKpiCards({ metrics, historical, isLoading }: KioskKpiCardsProps) {
  const renderDeltaBadge = (delta?: ComparisonDelta) => {
    if (!delta || !historical?.hasBaseline || delta.changeType === 'no-baseline') {
      return (
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-0.5">
          <Minus className="w-3 h-3 text-slate-300" />
          <span>{historical?.previousPeriodLabel || 'No baseline'}</span>
        </span>
      );
    }

    if (delta.changeType === 'increase') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          <ArrowUpRight className="w-3 h-3" />
          <span>{delta.formatted}</span>
          <span className="text-[10px] text-emerald-600 font-normal ml-0.5">({historical.previousPeriodLabel})</span>
        </span>
      );
    }

    if (delta.changeType === 'decrease') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
          <ArrowDownRight className="w-3 h-3" />
          <span>{delta.formatted}</span>
          <span className="text-[10px] text-rose-600 font-normal ml-0.5">({historical.previousPeriodLabel})</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
        <span>0%</span>
        <span className="text-[10px] text-slate-400 ml-0.5">({historical.previousPeriodLabel})</span>
      </span>
    );
  };

  const primaryCards = [
    {
      title: 'Paid Revenue',
      value: formatCurrency(metrics.totalRevenue),
      subtext: 'Calculated strictly from paid orders',
      delta: historical?.revenueDelta,
      icon: IndianRupee,
      accentColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    },
    {
      title: 'Total Orders',
      value: formatNumber(metrics.totalOrders),
      subtext: 'Created at this kiosk machine',
      delta: historical?.ordersDelta,
      icon: ShoppingBag,
      accentColor: 'text-slate-900',
      iconBg: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    {
      title: 'Paid Print Jobs',
      value: formatNumber(metrics.paidOrders),
      subtext: 'payment_status = completed',
      delta: historical?.paidOrdersDelta,
      icon: CheckCircle2,
      accentColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    },
    {
      title: 'Pages Printed',
      value: formatNumber(metrics.totalPages),
      subtext: 'Calculated as pages × copies',
      delta: historical?.pagesDelta,
      icon: FileText,
      accentColor: 'text-slate-900',
      iconBg: 'bg-blue-50 text-blue-700 border border-blue-100',
    },
  ];

  const secondaryCards = [
    {
      title: 'Physically Completed Prints',
      value: formatNumber(metrics.completedPrints),
      subtext: 'order status = completed',
      icon: Layers,
      accentColor: 'text-blue-700',
      iconBg: 'bg-blue-50 text-blue-700 border border-blue-100',
      note: 'Hardware output fulfilled',
    },
    {
      title: 'Average Order Value (AOV)',
      value: formatCurrency(metrics.avgOrderValue),
      subtext: 'Revenue divided by paid jobs',
      icon: TrendingUp,
      accentColor: 'text-slate-900',
      iconBg: 'bg-slate-50 text-slate-700 border border-slate-200',
      note: 'Ticket size efficiency',
    },
    {
      title: 'Avg Pages / Paid Order',
      value: formatNumber(metrics.avgPagesPerOrder),
      subtext: 'Average document print size',
      icon: FileText,
      accentColor: 'text-slate-900',
      iconBg: 'bg-slate-50 text-slate-700 border border-slate-200',
      note: 'Document density',
    },
    {
      title: 'Cancelled Orders',
      value: formatNumber(metrics.cancelledOrders),
      subtext: 'order status = cancelled',
      icon: XCircle,
      accentColor: metrics.cancelledOrders > 0 ? 'text-rose-700' : 'text-slate-500',
      iconBg: metrics.cancelledOrders > 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-400 border border-slate-200',
      note: 'Unfulfilled attempts',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Primary KPI Row with Historical Comparison Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
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

                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  {renderDeltaBadge(card.delta)}
                  <span className="text-[10px] text-slate-400">{card.subtext}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Operational & Fulfillment KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {secondaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0 pr-1">
                <div className="text-[11px] font-semibold text-slate-500 truncate">
                  {card.title}
                </div>
                {isLoading ? (
                  <div className="h-7 w-16 bg-slate-100 animate-pulse rounded mt-1" />
                ) : (
                  <div className={`text-2xl font-extrabold tracking-tight mt-0.5 ${card.accentColor}`}>
                    {card.value}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {card.note}
                </div>
              </div>

              <div className={`p-2.5 rounded-lg ${card.iconBg} flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
