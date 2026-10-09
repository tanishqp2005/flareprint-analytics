'use client';

import React from 'react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { RotateCw, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showDatePicker?: boolean;
  onMenuToggle?: () => void;
}

export function Header({
  title,
  description,
  onRefresh,
  isRefreshing,
  showDatePicker = true,
  onMenuToggle,
}: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-6 py-3.5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {showDatePicker && <DateRangePicker />}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Analytics Data"
              className="inline-flex items-center justify-center p-2 text-slate-600 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync</span>
          </div>
        </div>
      </div>
    </header>
  );
}
