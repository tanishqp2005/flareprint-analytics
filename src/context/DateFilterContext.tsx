'use client';

import React, { createContext, useContext, useState } from 'react';
import { DateFilter, DateRangePreset } from '@/types/analytics';

interface DateFilterContextType {
  dateFilter: DateFilter;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
}

const defaultFilter: DateFilter = {
  preset: '30d',
};

const DateFilterContext = createContext<DateFilterContextType>({
  dateFilter: defaultFilter,
  setPreset: () => {},
  setCustomRange: () => {},
});

export function DateFilterProvider({ children }: { children: React.ReactNode }) {
  const [dateFilter, setDateFilter] = useState<DateFilter>(defaultFilter);

  const setPreset = (preset: DateRangePreset) => {
    setDateFilter({
      preset,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const setCustomRange = (startDate: string, endDate: string) => {
    setDateFilter({
      preset: 'custom',
      startDate,
      endDate,
    });
  };

  return (
    <DateFilterContext.Provider value={{ dateFilter, setPreset, setCustomRange }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export function useDateFilter() {
  return useContext(DateFilterContext);
}
