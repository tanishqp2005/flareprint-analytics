'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SafeOrder } from '@/types/database';
import { useDateFilter } from '@/context/DateFilterContext';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import {
  FileText,
  ArrowRight,
  RotateCw,
  ShoppingBag,
} from 'lucide-react';

export function RecentOrdersPreview() {
  const { dateFilter } = useDateFilter();
  const [orders, setOrders] = useState<SafeOrder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchPreviewOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view: 'unified',
        limit: '5',
        offset: '0',
        preset: dateFilter.preset,
      });

      if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);

      const res = await authenticatedFetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching recent orders preview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviewOrders();
  }, [dateFilter]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Orders Activity</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Latest 5 of {totalCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Snapshot of the most recent print submissions across the entire kiosk fleet
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchPreviewOrders}
            disabled={loading}
            title="Refresh order preview"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded-lg border border-blue-200/60 transition-colors cursor-pointer"
          >
            <span>View All {totalCount} Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Table Preview */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Document File</th>
              <th className="py-2.5 px-4">Kiosk Asset</th>
              <th className="py-2.5 px-4 text-center">Pages</th>
              <th className="py-2.5 px-4 text-center">Mode</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4">Payment</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Created (IST)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600 mb-2" />
                  <div className="text-xs font-medium">Loading recent transactions...</div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <ShoppingBag className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <div className="text-xs font-semibold text-slate-700">No Orders in Period</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">No customer prints were placed in the selected time window.</div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 max-w-[200px]" title={order.file_name}>
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{order.file_name || 'kiosk-document'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {order.kiosk_id ? (
                      <Link
                        href={`/kiosks/${order.kiosk_id}`}
                        className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                      >
                        {order.kiosk_id}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Web Upload</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">
                    {(order.page_count ?? 1) * (order.copies ?? 1)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {order.color_print ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Color
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        B&W
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className="py-3 px-4">
                    {order.payment_status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {order.payment_status || 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {order.status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {order.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                    {formatDateTime(order.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Link */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
        <Link
          href="/orders"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>Open Full Order Management and Audit Logs</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
