'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { KioskDirectory } from '@/components/kiosks/KioskDirectory';
import { useDateFilter } from '@/context/DateFilterContext';
import { DashboardData } from '@/types/analytics';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { AlertCircle, RotateCw } from 'lucide-react';

export default function KiosksPage() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKioskData = async () => {
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
        throw new Error('Failed to retrieve kiosk hardware telemetry');
      }
      const result = await res.json();
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading kiosk analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKioskData();
  }, [dateFilter]);

  return (
    <AppLayout>
      <Header
        title="Kiosks Directory & Machine Comparison"
        description="Centralized machine directory, dual-channel connectivity status, comparative financial yield, and deep-dive analytics"
        onRefresh={fetchKioskData}
        isRefreshing={loading}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span><strong>Hardware Alert:</strong> {error}</span>
            </div>
            <button
              onClick={fetchKioskData}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 text-rose-700 rounded-lg font-semibold hover:bg-rose-50 transition-colors cursor-pointer text-xs"
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Central Kiosk Directory and Comparison */}
        <KioskDirectory
          kiosks={data?.kioskPerformance || []}
          summary={data?.kioskStatusSummary}
          isLoading={loading}
        />
      </div>
    </AppLayout>
  );
}
