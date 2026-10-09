'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { PrintConfigSection } from '@/components/dashboard/PrintConfigSection';
import { PeakHoursChart } from '@/components/dashboard/PeakHoursChart';
import { PrintDurationCard } from '@/components/dashboard/PrintDurationCard';
import { useDateFilter } from '@/context/DateFilterContext';
import { DashboardData } from '@/types/analytics';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { AlertCircle, RotateCw } from 'lucide-react';

export default function PrintAnalyticsPage() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
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
        throw new Error('Failed to load print telemetry analytics');
      }
      const result = await res.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching print analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  return (
    <AppLayout>
      <Header
        title="Print Volume & Telemetry Analytics"
        description="Color selections, duplex vs single-sided choices, peak demand patterns, and hardware execution speeds"
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span><strong>Analytics Alert:</strong> {error}</span>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer text-xs"
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* 1. Print Configuration: Color vs B&W, Single-sided vs Double-sided */}
        {data && (
          <PrintConfigSection
            metrics={data.printConfig}
            isLoading={loading}
          />
        )}

        {/* 2. Peak Hours 24-hour distribution */}
        {data && (
          <PeakHoursChart
            data={data.peakHours}
            isLoading={loading}
          />
        )}

        {/* 3. Print Duration: Session duration breakdown */}
        {data && (
          <PrintDurationCard
            metrics={data.printDuration}
            isLoading={loading}
          />
        )}
      </div>
    </AppLayout>
  );
}
