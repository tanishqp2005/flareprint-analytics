'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useDateFilter } from '@/context/DateFilterContext';
import { DateRangePreset } from '@/types/analytics';

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time', value: 'all' },
  { label: 'Custom range...', value: 'custom' },
];

export function DateRangePicker() {
  const { dateFilter, setPreset, setCustomRange } = useDateFilter();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const currentLabel = PRESETS.find((p) => p.value === dateFilter.preset)?.label || 'Last 30 days';

  const handleSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomModal(true);
      setIsOpen(false);
    } else {
      setPreset(preset);
      setIsOpen(false);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      setCustomRange(customStart, customEnd);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        id="date-range-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
      >
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span>{currentLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-40 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              Select Time Window
            </div>
            {PRESETS.map((preset) => {
              const isSelected = dateFilter.preset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelect(preset.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{preset.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Select Custom Date Range</h3>
            <p className="text-xs text-slate-500 mb-4">Specify start and end dates to filter analytics telemetry</p>
            
            <form onSubmit={handleApplyCustom} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
