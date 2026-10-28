import { DateRangePreset } from '@/types/analytics';

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Extracts the hour (0-23) in Indian Standard Time (Asia/Kolkata)
 */
export function getISTHour(dateInput: string | Date): number {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour');
  return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
}

/**
 * Extracts the calendar date key 'YYYY-MM-DD' in Indian Standard Time (Asia/Kolkata)
 */
export function getISTDateKey(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): {
  startDate: string | null;
  endDate: string | null;
} {
  const now = new Date();
  const todayStr = getISTDateKey(now);

  switch (preset) {
    case 'today': {
      const start = new Date(`${todayStr}T00:00:00.000+05:30`);
      const end = new Date(`${todayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'yesterday': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 1);
      const yesterdayStr = getISTDateKey(noon);
      const start = new Date(`${yesterdayStr}T00:00:00.000+05:30`);
      const end = new Date(`${yesterdayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case '7d': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 7);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      const end = new Date(`${todayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case '30d': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 30);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      const end = new Date(`${todayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case '90d': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 90);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      const end = new Date(`${todayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'custom': {
      const parseBoundary = (val: string | undefined, isEnd: boolean): string | null => {
        if (!val) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const time = isEnd ? '23:59:59.999' : '00:00:00.000';
          return new Date(`${val}T${time}+05:30`).toISOString();
        }
        return new Date(val).toISOString();
      };
      return {
        startDate: parseBoundary(customStart, false),
        endDate: parseBoundary(customEnd, true),
      };
    }
    case 'all':
    default:
      return { startDate: null, endDate: null };
  }
}

export function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00+05:30' : ''));
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getPreviousPeriodBounds(
  preset: DateRangePreset,
  currentStart?: string | null,
  currentEnd?: string | null
): {
  prevStartDate: string | null;
  prevEndDate: string | null;
  label: string;
} {
  const now = new Date();
  const todayStr = getISTDateKey(now);

  switch (preset) {
    case 'today': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 1);
      const yesterdayStr = getISTDateKey(noon);
      const start = new Date(`${yesterdayStr}T00:00:00.000+05:30`);
      const end = new Date(`${yesterdayStr}T23:59:59.999+05:30`);
      return { prevStartDate: start.toISOString(), prevEndDate: end.toISOString(), label: 'vs Yesterday' };
    }
    case 'yesterday': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 2);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      const end = new Date(`${pastStr}T23:59:59.999+05:30`);
      return { prevStartDate: start.toISOString(), prevEndDate: end.toISOString(), label: 'vs Previous Day' };
    }
    case '7d': {
      const noon14 = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon14.setDate(noon14.getDate() - 14);
      const noon7 = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon7.setDate(noon7.getDate() - 7);
      const start = new Date(`${getISTDateKey(noon14)}T00:00:00.000+05:30`);
      const end = new Date(`${getISTDateKey(noon7)}T00:00:00.000+05:30`);
      return { prevStartDate: start.toISOString(), prevEndDate: end.toISOString(), label: 'vs Prior 7 Days' };
    }
    case '30d': {
      const noon60 = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon60.setDate(noon60.getDate() - 60);
      const noon30 = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon30.setDate(noon30.getDate() - 30);
      const start = new Date(`${getISTDateKey(noon60)}T00:00:00.000+05:30`);
      const end = new Date(`${getISTDateKey(noon30)}T00:00:00.000+05:30`);
      return { prevStartDate: start.toISOString(), prevEndDate: end.toISOString(), label: 'vs Prior 30 Days' };
    }
    case '90d': {
      const noon180 = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon180.setDate(noon180.getDate() - 180);
      const noon90 = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon90.setDate(noon90.getDate() - 90);
      const start = new Date(`${getISTDateKey(noon180)}T00:00:00.000+05:30`);
      const end = new Date(`${getISTDateKey(noon90)}T00:00:00.000+05:30`);
      return { prevStartDate: start.toISOString(), prevEndDate: end.toISOString(), label: 'vs Prior 90 Days' };
    }
    case 'custom': {
      if (!currentStart || !currentEnd) {
        return { prevStartDate: null, prevEndDate: null, label: 'No baseline' };
      }
      const sMs = new Date(currentStart).getTime();
      const eMs = new Date(currentEnd).getTime();
      const durationMs = eMs - sMs;
      if (durationMs <= 0 || isNaN(durationMs)) {
        return { prevStartDate: null, prevEndDate: null, label: 'No baseline' };
      }
      const prevStart = new Date(sMs - durationMs).toISOString();
      const prevEnd = new Date(sMs).toISOString();
      return { prevStartDate: prevStart, prevEndDate: prevEnd, label: 'vs Prior Period' };
    }
    case 'all':
    default:
      return { prevStartDate: null, prevEndDate: null, label: 'All-time (no baseline)' };
  }
}

export function calculateComparisonDelta(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) {
      return {
        percentage: 0,
        changeType: 'neutral' as const,
        formatted: '0%',
        prevValue: 0,
      };
    }
    return {
      percentage: null,
      changeType: 'no-baseline' as const,
      formatted: 'Baseline: 0',
      prevValue: 0,
    };
  }

  const rawPct = ((current - previous) / previous) * 100;
  const rounded = Math.round(rawPct * 10) / 10;
  if (rounded > 0) {
    return {
      percentage: rounded,
      changeType: 'increase' as const,
      formatted: `+${rounded}%`,
      prevValue: previous,
    };
  }
  if (rounded < 0) {
    return {
      percentage: rounded,
      changeType: 'decrease' as const,
      formatted: `${rounded}%`,
      prevValue: previous,
    };
  }
  return {
    percentage: 0,
    changeType: 'neutral' as const,
    formatted: '0%',
    prevValue: previous,
  };
}

