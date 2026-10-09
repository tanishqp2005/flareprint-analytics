'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCw,
  X,
  CreditCard,
  Inbox,
} from 'lucide-react';
import { SafeOrder } from '@/types/database';
import { useDateFilter } from '@/context/DateFilterContext';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils/formatters';

interface RecentOrdersTableProps {
  initialOrders?: SafeOrder[];
  kioskList?: { kiosk_code: string; display_name: string }[];
}

export function RecentOrdersTable({ initialOrders = [], kioskList = [] }: RecentOrdersTableProps) {
  const { dateFilter } = useDateFilter();
  const [orders, setOrders] = useState<SafeOrder[]>(initialOrders);
  const [totalCount, setTotalCount] = useState<number>(initialOrders.length);
  const [loading, setLoading] = useState(false);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
        preset: dateFilter.preset,
      });

      if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
      if (selectedKiosk !== 'all') params.set('kioskCode', selectedKiosk);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (search.trim()) params.set('search', search.trim());

      const res = await authenticatedFetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, selectedKiosk, selectedStatus, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getPaymentStatusBadge = (status: string | null) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'printed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          Completed
        </span>
      );
    }
    if (s === 'processing' || s === 'printing') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Processing
        </span>
      );
    }
    if (s === 'cancelled' || s === 'failed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        {status || '—'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Order Logs & Telemetry</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade transactional print job logs sorted in real-time
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-slate-200 shadow-2xs self-start md:self-auto transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by document name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Kiosk:</span>
            <select
              value={selectedKiosk}
              onChange={(e) => {
                setSelectedKiosk(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="all">All Discovered Kiosks</option>
              {kioskList.map((k) => (
                <option key={k.kiosk_code} value={k.kiosk_code}>
                  {k.kiosk_code} ({k.display_name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Payment:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="pending">Pending Only</option>
              <option value="failed">Failed / Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Order Ref</th>
              <th className="py-3 px-4">Document File</th>
              <th className="py-3 px-4">Kiosk Asset</th>
              <th className="py-3 px-4 text-center">Pages</th>
              <th className="py-3 px-4 text-center">Copies</th>
              <th className="py-3 px-4 text-center">Color</th>
              <th className="py-3 px-4 text-center">Sides</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Print Status</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-200 border-t-orange-600 mb-2" />
                  <div className="text-xs font-medium">Fetching orders from database...</div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-16 text-center text-slate-400">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">No Orders Found</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    No orders match your filter criteria or selected time window.
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-500 text-[11px]" title={order.id}>
                    {order.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 max-w-[220px]" title={order.file_name}>
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-orange-500/80 flex-shrink-0" />
                      <span className="truncate">{order.file_name || 'kiosk-document'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {order.kiosk_id ? (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200/60">
                        {order.kiosk_id}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Web Upload</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-900">
                    {order.page_count ?? 1}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600 font-medium">
                    {order.copies ?? 1}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {order.color_print ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60">
                        Color
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                        B&W
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center capitalize text-slate-600 font-medium">
                    {order.print_sides || 'Single'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(order.total_price)}
                  </td>
                  <td className="py-3 px-4">
                    {getPaymentStatusBadge(order.payment_status)}
                  </td>
                  <td className="py-3 px-4">
                    {getOrderStatusBadge(order.status)}
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

      {/* Pagination Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing {orders.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, totalCount)} of {totalCount} orders
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-medium text-slate-700 text-xs">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
