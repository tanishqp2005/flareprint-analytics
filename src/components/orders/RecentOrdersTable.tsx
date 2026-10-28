'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCw,
  X,
  CreditCard,
  Inbox,
  ArrowUpRight,
  Layers,
  ShoppingBag,
  Cpu,
  Clock,
  FilterX,
} from 'lucide-react';
import { SafeOrder, SafeKioskSession, UnifiedJobLog } from '@/types/database';
import { useDateFilter } from '@/context/DateFilterContext';
import { authenticatedFetch } from '@/lib/api/client-fetch';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';

export type OrdersTableViewMode = 'unified' | 'orders' | 'sessions';

interface RecentOrdersTableProps {
  initialOrders?: SafeOrder[];
  kioskList?: { kiosk_code: string; display_name: string }[];
  lockedKioskCode?: string;
  initialKioskCode?: string;
  initialPrintStatus?: string;
  initialPaymentStatus?: string;
  initialViewMode?: OrdersTableViewMode;
  title?: string;
  description?: string;
  viewAllLink?: string;
}

export type TableRecord = SafeOrder | SafeKioskSession | UnifiedJobLog;

export function RecentOrdersTable({
  initialOrders = [],
  kioskList = [],
  lockedKioskCode,
  initialKioskCode = 'all',
  initialPrintStatus = 'all',
  initialPaymentStatus = 'all',
  initialViewMode = 'unified',
  title = 'Order Logs & Telemetry',
  description = 'Audit-grade transactional print job logs and kiosk session telemetry',
  viewAllLink,
}: RecentOrdersTableProps) {
  const { dateFilter } = useDateFilter();
  const [viewMode, setViewMode] = useState<OrdersTableViewMode>(initialViewMode);
  const [items, setItems] = useState<TableRecord[]>(initialOrders);
  const [totalCount, setTotalCount] = useState<number>(initialOrders.length);
  const [loading, setLoading] = useState(false);
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null);

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState(lockedKioskCode || initialKioskCode);
  const [selectedStatus, setSelectedStatus] = useState(initialPaymentStatus);
  const [selectedPrintStatus, setSelectedPrintStatus] = useState(initialPrintStatus);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // If lockedKioskCode changes
  useEffect(() => {
    if (lockedKioskCode) {
      setSelectedKiosk(lockedKioskCode);
    }
  }, [lockedKioskCode]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const activeKiosk = lockedKioskCode || selectedKiosk;
      const params = new URLSearchParams({
        view: viewMode,
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
        preset: dateFilter.preset,
      });

      if (dateFilter.startDate) params.set('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.set('endDate', dateFilter.endDate);
      if (activeKiosk !== 'all') params.set('kioskCode', activeKiosk);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedPrintStatus !== 'all') params.set('printStatus', selectedPrintStatus);
      if (search.trim()) params.set('search', search.trim());

      const res = await authenticatedFetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const records = (data.jobs || data.sessions || data.orders || []) as (UnifiedJobLog | SafeOrder | SafeKioskSession)[];
        setItems(records);
        setTotalCount(data.totalCount || 0);

        if (records.length > 0 && records[0].created_at) {
          setLatestTimestamp(records[0].created_at);
        } else {
          setLatestTimestamp(null);
        }
      }
    } catch (err) {
      console.error('Error fetching order records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, viewMode, selectedKiosk, selectedStatus, selectedPrintStatus, dateFilter, lockedKioskCode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const resetAllFilters = () => {
    setSearch('');
    setSelectedKiosk(lockedKioskCode || 'all');
    setSelectedStatus('all');
    setSelectedPrintStatus('all');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getPaymentBadge = (status: string | null) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid
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
            {status || '—'}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'printed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          Completed
        </span>
      );
    }
    if (s === 'processing' || s === 'printing' || s === 'active') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {s === 'active' ? 'Active Session' : 'Processing'}
        </span>
      );
    }
    if (s === 'expired') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Expired
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

  const getSourceBadge = (source?: string) => {
    if (source === 'reconciled') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Matched session with verified order payment">
          Reconciled
        </span>
      );
    }
    if (source === 'kiosk_session') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Physical kiosk machine session">
          Kiosk Session
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Verified public.orders database record">
        Order Record
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {totalCount} Total
            </span>
            {latestTimestamp && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">
                <Clock className="w-3 h-3" />
                <span>Latest: {formatDateTime(latestTimestamp)}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <span>View in All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            onClick={fetchRecords}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Records</span>
          </button>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="px-5 pt-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setViewMode('unified');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all cursor-pointer ${
              viewMode === 'unified'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Unified Activity Log</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700 font-bold">
              Reconciled
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('orders');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all cursor-pointer ${
              viewMode === 'orders'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (public.orders)
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('sessions');
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold border-b-2 transition-all cursor-pointer ${
              viewMode === 'sessions'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Kiosk Sessions</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (public.kiosk_sessions)
            </span>
          </button>
        </div>

        {(search || selectedKiosk !== (lockedKioskCode || 'all') || selectedStatus !== 'all' || selectedPrintStatus !== 'all') && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer mb-2"
          >
            <FilterX className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by document name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
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
          {lockedKioskCode ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Kiosk:</span>
              <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-900 text-white shadow-2xs">
                {lockedKioskCode}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Kiosk:</span>
              <select
                value={selectedKiosk}
                onChange={(e) => {
                  setSelectedKiosk(e.target.value);
                  setPage(1);
                }}
                className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">All Discovered Kiosks</option>
                {kioskList.map((k) => (
                  <option key={k.kiosk_code} value={k.kiosk_code}>
                    {k.kiosk_code} ({k.display_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Payment:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="completed">Paid Only</option>
              <option value="pending">Pending Only</option>
              <option value="failed">Failed / Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">
              {viewMode === 'sessions' ? 'Session State:' : 'Print Status:'}
            </span>
            <select
              value={selectedPrintStatus}
              onChange={(e) => {
                setSelectedPrintStatus(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              {viewMode === 'sessions' || viewMode === 'unified' ? (
                <>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="active">Active / In-progress</option>
                </>
              ) : (
                <>
                  <option value="processing">Processing / Printing</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Record Ref</th>
              {viewMode === 'unified' && <th className="py-3 px-4">Source</th>}
              <th className="py-3 px-4">Document / Context</th>
              <th className="py-3 px-4">Kiosk Asset</th>
              <th className="py-3 px-4 text-center">Pages</th>
              {viewMode !== 'sessions' && <th className="py-3 px-4 text-center">Copies</th>}
              {viewMode !== 'sessions' && <th className="py-3 px-4 text-center">Color</th>}
              <th className="py-3 px-4 text-center">Sides</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4">Timestamp (IST)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={12} className="py-16 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600 mb-2" />
                  <div className="text-xs font-medium">Fetching records from live database...</div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-16 text-center text-slate-400">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">No Records Found</div>
                  <div className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                    No activity matches your active filters or time window. Try selecting &quot;Last 30 days&quot; or resetting the kiosk filter.
                  </div>
                  <button
                    onClick={resetAllFilters}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    <FilterX className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const uItem = item as UnifiedJobLog;
                const sItem = item as SafeKioskSession;
                const oItem = item as SafeOrder;

                const kioskCode =
                  viewMode === 'sessions'
                    ? sItem.kiosk_code
                    : viewMode === 'unified'
                    ? uItem.kiosk_id
                    : oItem.kiosk_id;

                const fileName =
                  item.file_name ||
                  (viewMode === 'sessions' ? 'kiosk-session' : 'kiosk-document');

                const pages = item.page_count ?? 1;
                const copies = 'copies' in item ? (item.copies ?? 1) : 1;
                const colorPrint = 'color_print' in item ? item.color_print : false;
                const printSides = item.print_sides || 'single';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-500 text-[11px]" title={item.id}>
                      {item.id.slice(0, 8)}
                    </td>

                    {viewMode === 'unified' && (
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSourceBadge(uItem.source)}
                      </td>
                    )}

                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[220px]" title={fileName}>
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {kioskCode ? (
                        <Link
                          href={`/kiosks/${kioskCode}`}
                          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-semibold border border-slate-200/80 transition-colors"
                        >
                          {kioskCode}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Web Upload</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-medium text-slate-900">
                      {pages}
                    </td>

                    {viewMode !== 'sessions' && (
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {copies}
                      </td>
                    )}

                    {viewMode !== 'sessions' && (
                      <td className="py-3 px-4 text-center">
                        {colorPrint ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            Color
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                            B&W
                          </span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-4 text-center capitalize text-slate-600 font-medium">
                      {printSides}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.total_price ?? 0)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPaymentBadge(item.payment_status)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDateTime(item.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing {items.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(page * pageSize, totalCount)} of {totalCount} records
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
