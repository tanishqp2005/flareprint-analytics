'use client';

import React, { useState, useEffect, Suspense, use } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { KioskDetailHeader } from '@/components/kiosks/KioskDetailHeader';
import { KioskKpiCards } from '@/components/kiosks/KioskKpiCards';
import { OrderDailyChart } from '@/components/dashboard/OrderDailyChart';
import { PeakHoursChart } from '@/components/dashboard/PeakHoursChart';
import { PrintConfigSection } from '@/components/dashboard/PrintConfigSection';
import { KioskOperationalCard } from '@/components/kiosks/KioskOperationalCard';
import { PageCopyDistributionCard } from '@/components/kiosks/PageCopyDistributionCard';
import { RecentOrdersTable } from '@/components/orders/RecentOrdersTable';
import { useDateFilter } from '@/context/DateFilterContext';
import { KioskDetailData } from '@/types/analytics';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { AlertCircle, RotateCw, ArrowLeft } from 'lucide-react';

interface KioskDetailContentProps {
  params: Promise<{ kiosk_code: string }>;
}

function KioskDetailContent({ params }: KioskDetailContentProps) {
  const unwrappedParams = use(params);
  const kioskCode = unwrappedParams?.kiosk_code || '';
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState<KioskDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKioskTelemetry = async () => {
    if (!kioskCode) return;
    setLoading(true);
    setError(null);
    try {
      const qParams = new URLSearchParams({
        preset: dateFilter.preset,
      });
      if (dateFilter.startDate) qParams.set('startDate', dateFilter.startDate);
      if (dateFilter.endDate) qParams.set('endDate', dateFilter.endDate);

      const res = await authenticatedFetch(
        `/api/kiosks/${encodeURIComponent(kioskCode)}?${qParams.toString()}`
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to retrieve telemetry for kiosk ${kioskCode}`);
      }

      const result = await res.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading kiosk analytics';
      setError(msg);
      console.error(`Error in KioskDetailPage (${kioskCode}):`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKioskTelemetry();
  }, [kioskCode, dateFilter]);

  return (
    <AppLayout>
      {/* 1. Kiosk Dashboard Header */}
      {data ? (
        <KioskDetailHeader
          kiosk={data.kiosk}
          onRefresh={fetchKioskTelemetry}
          isRefreshing={loading}
        />
      ) : (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/kiosks"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Kiosks</span>
            </Link>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
              {kioskCode}
            </span>
          </div>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span><strong>Hardware Alert:</strong> {error}</span>
            </div>
            <button
              onClick={fetchKioskTelemetry}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer text-xs"
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* 2. Kiosk-Specific KPI Cards with Historical Comparison */}
        {data ? (
          <KioskKpiCards
            metrics={data.overview}
            historical={data.historicalComparison}
            isLoading={loading}
          />
        ) : (
          <KioskKpiCards
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

        {/* 3. Section A: Revenue and Volume (Daily Trend Chart) */}
        <OrderDailyChart
          data={data?.dailyAnalytics || []}
          isLoading={loading}
        />

        {/* 4. Section B: Hourly Demand & Section D: Operational Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PeakHoursChart
            data={data?.hourlyDemand || []}
            isLoading={loading}
          />

          {data && (
            <KioskOperationalCard
              operational={data.operational}
              isLoading={loading}
            />
          )}
        </div>

        {/* 5. Section C: Print Preferences & Document Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data && (
            <PrintConfigSection
              metrics={data.printConfig}
              isLoading={loading}
            />
          )}

          {data && (
            <PageCopyDistributionCard
              distribution={data.pageCopyDistribution}
              totalOrders={data.overview.paidOrders}
              isLoading={loading}
            />
          )}
        </div>

        {/* 6. Section E: Recent Kiosk Orders (Locked exclusively to this machine) */}
        <RecentOrdersTable
          lockedKioskCode={kioskCode}
          title={`Recent Orders at ${data?.kiosk.display_name || kioskCode}`}
          description={`Transactional log of print jobs submitted directly to ${kioskCode}`}
          viewAllLink={`/orders?kiosk=${kioskCode}`}
        />
      </div>
    </AppLayout>
  );
}

export default function KioskDetailPage({
  params,
}: {
  params: Promise<{ kiosk_code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading machine analytics...
        </div>
      }
    >
      <KioskDetailContent params={params} />
    </Suspense>
  );
}
