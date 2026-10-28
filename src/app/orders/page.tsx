'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { RecentOrdersTable } from '@/components/orders/RecentOrdersTable';
import { createClient } from '@/lib/supabase/client';

function OrdersContent() {
  const searchParams = useSearchParams();
  const kioskParam = searchParams.get('kiosk') || 'all';
  const statusParam = searchParams.get('status') || 'all';
  const printStatusParam = searchParams.get('printStatus') || 'all';
  const viewParam = (searchParams.get('view') || 'unified') as 'unified' | 'orders' | 'sessions';

  const [kiosks, setKiosks] = useState<{ kiosk_code: string; display_name: string }[]>([]);

  useEffect(() => {
    async function loadKiosks() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('kiosks')
          .select('kiosk_code, display_name')
          .order('kiosk_code');
        if (data) {
          setKiosks(data);
        }
      } catch (err) {
        console.error('Error fetching kiosks list for orders filter:', err);
      }
    }
    loadKiosks();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <RecentOrdersTable
        kioskList={kiosks}
        initialKioskCode={kioskParam}
        initialPaymentStatus={statusParam}
        initialPrintStatus={printStatusParam}
        initialViewMode={viewParam}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AppLayout>
      <Header
        title="Order Management & Logs"
        description="Real-time transactional audit log with kiosk attribution, payment verification, and fulfillment state"
      />

      <Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Loading order audit log...</div>}>
        <OrdersContent />
      </Suspense>
    </AppLayout>
  );
}
