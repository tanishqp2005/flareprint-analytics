'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { RecentOrdersTable } from '@/components/orders/RecentOrdersTable';
import { createClient } from '@/lib/supabase/client';

export default function OrdersPage() {
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
    <AppLayout>
      <Header
        title="Order Management & Logs"
        description="Real-time transactional audit log with kiosk attribution, payment verification, and fulfillment state"
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <RecentOrdersTable kioskList={kiosks} />
      </div>
    </AppLayout>
  );
}
