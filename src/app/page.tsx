'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { OverviewKpiCards } from '@/components/dashboard/OverviewKpiCards';
import { OrderDailyChart } from '@/components/dashboard/OrderDailyChart';
import { KioskSummarySection } from '@/components/dashboard/KioskSummarySection';
import { RecentOrdersPreview } from '@/components/dashboard/RecentOrdersPreview';
import { useDateFilter } from '@/context/DateFilterContext';
import { DashboardData } from '@/types/analytics';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { AlertCircle, RotateCw } from 'lucide-react';

export default function OverviewPage() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        preset: dateFilter.preset,
      });
      if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);

      const res = await authenticatedFetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unable to retrieve analytics telemetry');
      }

      const result = await res.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching analytics telemetry';
      setError(msg);
      console.error('Error in OverviewPage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [dateFilter]);

  return (
    <AppLayout>
      <Header
        title="Global Business Overview"
        description="Business-wide performance across all kiosks, network financial yield, and daily velocity"
        onRefresh={fetchOverviewData}
        isRefreshing={loading}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span><strong>Telemetry Notice:</strong> {error}</span>
            </div>
            <button
              onClick={fetchOverviewData}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer text-xs"
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* 1. Global Business KPI Cards */}
        {data ? (
          <OverviewKpiCards metrics={data.overview} isLoading={loading} />
        ) : (
          <OverviewKpiCards
            metrics={{
              totalOrders: 0,
              paidOrders: 0,
              completedPrints: 0,
              cancelledOrders: 0,
              totalRevenue: 0,
              totalPages: 0,
              avgOrderValue: 0,
              avgPagesPerOrder: 0,
            }}
            isLoading={loading}
          />
        )}

        {/* 2. Chronological Revenue and Order Daily Velocity Chart */}
        <OrderDailyChart
          data={data?.dailyAnalytics || []}
          isLoading={loading}
        />

        {/* 3. Kiosk Fleet Comparison Summary & Best-Performing Machine */}
        <KioskSummarySection
          kiosks={data?.kioskPerformance || []}
          isLoading={loading}
        />

        {/* 4. Compact Recent Orders Activity Preview with link to full Orders */}
        <RecentOrdersPreview />
      </div>
    </AppLayout>
  );
}
