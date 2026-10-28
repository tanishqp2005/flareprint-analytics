'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { KioskPerformanceItem, KioskStatusSummary } from '@/types/analytics';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils/formatters';
import {
  Search,
  ArrowRight,
  Monitor,
  LayoutGrid,
  List,
  MapPin,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  Cpu,
  Layers,
} from 'lucide-react';

interface KioskDirectoryProps {
  kiosks: KioskPerformanceItem[];
  summary?: KioskStatusSummary;
  isLoading?: boolean;
}

type SortField = 'revenue' | 'paidOrders' | 'completedPrints' | 'pagesPrinted' | 'last_heartbeat';

export function KioskDirectory({ kiosks, summary, isLoading }: KioskDirectoryProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'stale' | 'active' | 'idle'>('all');
  const [sortBy, setSortBy] = useState<SortField>('revenue');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter and sort kiosks
  const filteredKiosks = useMemo(() => {
    return kiosks
      .filter((k) => {
        // Search term match
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchCode = k.kiosk_code.toLowerCase().includes(q);
          const matchName = k.display_name.toLowerCase().includes(q);
          const matchLocation = (k.location || '').toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchLocation) return false;
        }

        // Status filter match
        if (statusFilter === 'online') {
          return k.connectionIndicator === 'online';
        }
        if (statusFilter === 'stale') {
          return k.connectionIndicator === 'stale';
        }
        if (statusFilter === 'active') {
          return (k.status || '').toLowerCase() === 'active';
        }
        if (statusFilter === 'idle') {
          return (k.status || '').toLowerCase() === 'idle';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        if (sortBy === 'paidOrders') return b.paidOrders - a.paidOrders;
        if (sortBy === 'completedPrints') return b.completedPrints - a.completedPrints;
        if (sortBy === 'pagesPrinted') return b.pagesPrinted - a.pagesPrinted;
        if (sortBy === 'last_heartbeat') {
          const timeA = a.last_heartbeat ? new Date(a.last_heartbeat).getTime() : 0;
          const timeB = b.last_heartbeat ? new Date(b.last_heartbeat).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [kiosks, search, statusFilter, sortBy]);

  const getDbStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            DB: Active
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            DB: Idle
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            DB: Online
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            DB: {status || 'Offline'}
          </span>
        );
    }
  };

  const getHeartbeatBadge = (indicator: 'online' | 'stale') => {
    if (indicator === 'online') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Heartbeat Online (&lt;5m)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Heartbeat Stale
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Fleet Topline Counters */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.totalKiosks}</div>
              <div className="text-[11px] font-semibold text-slate-500">Total Kiosks</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-950 tracking-tight">{summary.connectedHeartbeats}</div>
              <div className="text-[11px] font-semibold text-emerald-700">Heartbeat Online</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.staleHeartbeats}</div>
              <div className="text-[11px] font-semibold text-slate-600">Heartbeat Stale</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-blue-950 tracking-tight">{summary.byDbStatus['active'] || 0}</div>
              <div className="text-[11px] font-semibold text-blue-700">DB Printing/Active</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Control Bar: Search, Filters, Sorting, and View Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search kiosk code, name, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Machines ({kiosks.length})</option>
              <option value="online">Heartbeat Online</option>
              <option value="stale">Heartbeat Stale</option>
              <option value="active">DB Active Only</option>
              <option value="idle">DB Idle Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="revenue">Paid Revenue (High to Low)</option>
              <option value="paidOrders">Paid Print Jobs</option>
              <option value="completedPrints">Completed Prints</option>
              <option value="pagesPrinted">Pages Printed</option>
              <option value="last_heartbeat">Last Telemetry Seen</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Comparison Table View"
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Empty State */}
      {filteredKiosks.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <Monitor className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No Matching Kiosks Found</h4>
          <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
            No kiosk matches your search query or status filter. Try clearing your filters.
          </p>
        </div>
      )}

      {/* 4. Grid View */}
      {viewMode === 'grid' && filteredKiosks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKiosks.map((kiosk) => {
            const isOnline = kiosk.connectionIndicator === 'online';
            return (
              <div
                key={kiosk.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white shadow-2xs">
                          {kiosk.kiosk_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                          {kiosk.display_name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Location: <strong>{kiosk.location || 'Unspecified'}</strong></span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {getHeartbeatBadge(kiosk.connectionIndicator)}
                      {getDbStatusBadge(kiosk.status)}
                    </div>
                  </div>

                  {/* Kiosk Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 border-b border-slate-100 text-center">
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                      <div className="text-[10px] uppercase font-semibold text-emerald-700">Paid Revenue</div>
                      <div className="text-base font-extrabold text-emerald-950 mt-0.5">
                        {formatCurrency(kiosk.revenue)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Paid Jobs</div>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {formatNumber(kiosk.paidOrders)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                      <div className="text-[10px] uppercase font-semibold text-blue-700">Completed Prints</div>
                      <div className="text-base font-extrabold text-blue-950 mt-0.5">
                        {formatNumber(kiosk.completedPrints)}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Pages Printed</div>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {formatNumber(kiosk.pagesPrinted)}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Line: AOV & Last seen */}
                  <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Last heartbeat: <strong className="font-semibold text-slate-700">{formatRelativeTime(kiosk.last_heartbeat)}</strong>
                    </span>

                    <span>
                      Avg Ticket (AOV): <strong className="font-bold text-slate-800">{formatCurrency(kiosk.avgOrderValue)}</strong>
                    </span>
                  </div>
                </div>

                {/* Click-through Action Footer */}
                <Link
                  href={`/kiosks/${kiosk.kiosk_code}`}
                  className="bg-slate-50 hover:bg-blue-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 transition-colors cursor-pointer"
                >
                  <span>Open Dedicated Analytics Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Comparison Table View */}
      {viewMode === 'table' && filteredKiosks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kiosk Code</th>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">DB Status</th>
                  <th className="py-3 px-4">Heartbeat</th>
                  <th className="py-3 px-4">Last Seen</th>
                  <th className="py-3 px-4 text-right">Paid Jobs</th>
                  <th className="py-3 px-4 text-right">Completed Prints</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Pages</th>
                  <th className="py-3 px-4 text-right">Avg Ticket (AOV)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredKiosks.map((kiosk) => (
                  <tr key={kiosk.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {kiosk.kiosk_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {kiosk.display_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {kiosk.location || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {getDbStatusBadge(kiosk.status)}
                    </td>
                    <td className="py-3.5 px-4">
                      {kiosk.connectionIndicator === 'online' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Stale
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(kiosk.last_heartbeat)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatNumber(kiosk.paidOrders)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-700">
                      {formatNumber(kiosk.completedPrints)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                      {formatCurrency(kiosk.revenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatNumber(kiosk.pagesPrinted)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                      {formatCurrency(kiosk.avgOrderValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/kiosks/${kiosk.kiosk_code}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
                      >
                        <span>Dashboard</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
