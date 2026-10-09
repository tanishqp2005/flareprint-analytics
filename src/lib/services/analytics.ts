import { SupabaseClient } from '@supabase/supabase-js';
import {
  DateFilter,
  OverviewMetrics,
  DailyAnalyticsItem,
  KioskPerformanceItem,
  HourlyVolumeItem,
  PrintConfigMetrics,
  PrintDurationMetrics,
  KioskDurationItem,
  KioskStatusSummary,
  DashboardData,
} from '@/types/analytics';
import { Order, SafeOrder, Kiosk, KioskSession } from '@/types/database';
import { getDateRangeBounds, formatDateLabel } from '@/lib/utils/date-helpers';

/**
 * Filter orders and sessions based on date range bounds
 */
function applyDateFilter<T extends { created_at?: string; started_at?: string }>(
  items: T[],
  startDate: string | null,
  endDate: string | null,
  dateField: 'created_at' | 'started_at' = 'created_at'
): T[] {
  if (!startDate && !endDate) return items;

  const startMs = startDate ? new Date(startDate).getTime() : -Infinity;
  const endMs = endDate ? new Date(endDate).getTime() : Infinity;

  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const time = new Date(raw).getTime();
    return time >= startMs && time <= endMs;
  });
}

/**
 * 1. Overview KPI Metrics
 * Strict separated definitions:
 * - totalOrders: All orders created within selected date range
 * - paidOrders: payment_status === 'completed'
 * - completedPrints: status === 'completed'
 * - cancelledOrders: status === 'cancelled'
 * - totalRevenue, totalPages, AOV: calculated strictly from paidOrders
 */
export function calculateOverviewMetrics(orders: Order[]): OverviewMetrics {
  const totalOrders = orders.length;

  // Strict payment separation: Successful payment != successful print
  const paidOrdersList = orders.filter((o) => o.payment_status === 'completed');
  const paidOrders = paidOrdersList.length;

  const completedPrints = orders.filter((o) => o.status === 'completed').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  // Revenue, pages and AOV are calculated strictly from paid orders
  const totalRevenue = paidOrdersList.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
  const totalPages = paidOrdersList.reduce((sum, o) => {
    const pageCount = Number(o.page_count) || 0;
    const copies = Number(o.copies) || 1;
    return sum + pageCount * copies;
  }, 0);

  const avgOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;
  const avgPagesPerOrder = paidOrders > 0 ? totalPages / paidOrders : 0;

  return {
    totalOrders,
    paidOrders,
    completedPrints,
    cancelledOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalPages,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    avgPagesPerOrder: Math.round(avgPagesPerOrder * 10) / 10,
  };
}

/**
 * 2. Daily Analytics (Orders, Revenue, Pages printed per day)
 */
export function calculateDailyAnalytics(orders: Order[], startDate: string | null, endDate: string | null): DailyAnalyticsItem[] {
  const dailyMap: { [dateStr: string]: { orders: number; revenue: number; pages: number } } = {};

  // Build a calendar template if within 30 or 7 days range
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);

    const maxLoops = 120;
    let loops = 0;
    while (cur <= end && loops < maxLoops) {
      const key = cur.toISOString().split('T')[0];
      dailyMap[key] = { orders: 0, revenue: 0, pages: 0 };
      cur.setDate(cur.getDate() + 1);
      loops++;
    }
  }

  // Populate actual data
  orders.forEach((o) => {
    if (!o.created_at) return;
    const dateKey = o.created_at.split('T')[0];
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { orders: 0, revenue: 0, pages: 0 };
    }
    dailyMap[dateKey].orders += 1;

    if (o.payment_status === 'completed') {
      const rev = Number(o.total_price) || 0;
      const pages = (Number(o.page_count) || 0) * (Number(o.copies) || 1);
      dailyMap[dateKey].revenue += rev;
      dailyMap[dateKey].pages += pages;
    }
  });

  const sortedDates = Object.keys(dailyMap).sort();
  return sortedDates.map((date) => ({
    date,
    formattedDate: formatDateLabel(date),
    orders: dailyMap[date].orders,
    revenue: Math.round(dailyMap[date].revenue * 100) / 100,
    pages: dailyMap[date].pages,
  }));
}

/**
 * 3. Kiosk Performance
 * Joins orders using: orders.kiosk_id = kiosks.kiosk_code (NOT kiosks.id)
 */
export function calculateKioskPerformance(kiosks: Kiosk[], orders: Order[]): KioskPerformanceItem[] {
  return kiosks.map((kiosk) => {
    // Join using orders.kiosk_id = kiosks.kiosk_code
    const kioskOrders = orders.filter((o) => o.kiosk_id && o.kiosk_id.toLowerCase() === kiosk.kiosk_code.toLowerCase());
    const paidKioskOrders = kioskOrders.filter((o) => o.payment_status === 'completed');

    const paidOrdersCount = paidKioskOrders.length;
    const revenue = paidKioskOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const pagesPrinted = paidKioskOrders.reduce((sum, o) => {
      const pageCount = Number(o.page_count) || 0;
      const copies = Number(o.copies) || 1;
      return sum + pageCount * copies;
    }, 0);

    const avgOrderValue = paidOrdersCount > 0 ? revenue / paidOrdersCount : 0;

    // Derived connection indicator: fresh heartbeat within 5 minutes (300,000 ms)
    const now = Date.now();
    const heartbeatMs = kiosk.last_heartbeat ? new Date(kiosk.last_heartbeat).getTime() : 0;
    const isHeartbeatFresh = Boolean(kiosk.last_heartbeat && !isNaN(heartbeatMs) && (now - heartbeatMs) <= 5 * 60 * 1000);

    return {
      id: kiosk.id,
      kiosk_code: kiosk.kiosk_code,
      display_name: kiosk.display_name || kiosk.kiosk_code,
      location: kiosk.location || 'Unknown',
      status: kiosk.status || 'offline', // Actual database status
      last_heartbeat: kiosk.last_heartbeat || null,
      connectionIndicator: isHeartbeatFresh ? 'online' : 'stale',
      connectionLabel: isHeartbeatFresh ? 'Heartbeat Online' : 'Heartbeat Stale',
      is_active: kiosk.is_active ?? false,
      paidOrders: paidOrdersCount,
      pagesPrinted,
      revenue: Math.round(revenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    };
  });
}

/**
 * 4. Peak Hours (00:00 to 23:00)
 * Uses completed/paid orders
 */
export function calculateHourlyAnalytics(orders: Order[]): HourlyVolumeItem[] {
  const hourlyMap: { [hour: number]: { orders: number; revenue: number } } = {};

  for (let h = 0; h < 24; h++) {
    hourlyMap[h] = { orders: 0, revenue: 0 };
  }

  // Use completed/paid orders
  const paidOrders = orders.filter((o) => o.payment_status === 'completed');

  paidOrders.forEach((o) => {
    if (!o.created_at) return;
    const date = new Date(o.created_at);
    if (isNaN(date.getTime())) return;
    const hour = date.getHours();
    hourlyMap[hour].orders += 1;
    hourlyMap[hour].revenue += Number(o.total_price) || 0;
  });

  return Array.from({ length: 24 }, (_, i) => {
    const formattedHour = `${i.toString().padStart(2, '0')}:00`;
    return {
      hour: formattedHour,
      hourNumber: i,
      orders: hourlyMap[i].orders,
      revenue: Math.round(hourlyMap[i].revenue * 100) / 100,
    };
  });
}

/**
 * 5. Print Configuration
 * Black & White vs Color, Single-sided vs Double-sided (completed/paid orders)
 */
export function calculatePrintConfiguration(orders: Order[]): PrintConfigMetrics {
  const paidOrders = orders.filter((o) => o.payment_status === 'completed');

  let bwOrders = 0;
  let colorOrders = 0;
  let singleSidedOrders = 0;
  let doubleSidedOrders = 0;

  paidOrders.forEach((o) => {
    if (o.color_print) {
      colorOrders += 1;
    } else {
      bwOrders += 1;
    }

    const sides = (o.print_sides || '').toLowerCase().trim();
    if (sides.includes('double') || sides.includes('duplex') || sides === 'both') {
      doubleSidedOrders += 1;
    } else {
      // Default to single-sided
      singleSidedOrders += 1;
    }
  });

  return {
    bwOrders,
    colorOrders,
    singleSidedOrders,
    doubleSidedOrders,
    totalConfigOrders: paidOrders.length,
  };
}

/**
 * 6. Print Duration
 * Uses kiosk_sessions: status = 'completed' AND completed_at IS NOT NULL
 * Duration: completed_at - started_at in seconds
 */
export function calculatePrintDuration(sessions: KioskSession[], kiosks: Kiosk[]): PrintDurationMetrics {
  // Completed sessions with completed_at and started_at
  const validSessions = sessions.filter(
    (s) => s.status === 'completed' && s.completed_at && s.started_at
  );

  const durations: number[] = [];
  const kioskMap: { [kioskId: string]: number[] } = {};

  validSessions.forEach((s) => {
    const start = new Date(s.started_at!).getTime();
    const end = new Date(s.completed_at!).getTime();
    const diffSecs = (end - start) / 1000;

    if (diffSecs >= 0 && diffSecs < 7200) { // filter out anomalous sessions > 2 hours
      durations.push(diffSecs);

      if (!kioskMap[s.kiosk_id]) {
        kioskMap[s.kiosk_id] = [];
      }
      kioskMap[s.kiosk_id].push(diffSecs);
    }
  });

  const overallCount = durations.length;
  const overallAvg = overallCount > 0 ? durations.reduce((a, b) => a + b, 0) / overallCount : 0;
  const overallMin = overallCount > 0 ? Math.min(...durations) : 0;
  const overallMax = overallCount > 0 ? Math.max(...durations) : 0;

  const byKiosk: KioskDurationItem[] = kiosks.map((kiosk) => {
    // kiosk_sessions.kiosk_id references kiosks.id (UUID)
    const kDurations = kioskMap[kiosk.id] || [];
    const count = kDurations.length;
    const avg = count > 0 ? kDurations.reduce((a, b) => a + b, 0) / count : 0;
    const min = count > 0 ? Math.min(...kDurations) : 0;
    const max = count > 0 ? Math.max(...kDurations) : 0;

    return {
      kiosk_id: kiosk.id,
      kiosk_code: kiosk.kiosk_code,
      display_name: kiosk.display_name || kiosk.kiosk_code,
      sessionCount: count,
      avgDurationSeconds: Math.round(avg),
      minDurationSeconds: Math.round(min),
      maxDurationSeconds: Math.round(max),
    };
  });

  return {
    overallAvgSeconds: Math.round(overallAvg),
    overallMinSeconds: Math.round(overallMin),
    overallMaxSeconds: Math.round(overallMax),
    completedSessionsCount: overallCount,
    byKiosk,
  };
}

/**
 * Kiosk Status Summary
 * Clearly separates actual database status from connection heartbeat indicator
 */
export function calculateKioskStatusSummary(kiosks: Kiosk[]): KioskStatusSummary {
  const now = Date.now();
  let connectedHeartbeats = 0;
  let staleHeartbeats = 0;
  const byDbStatus: { [status: string]: number } = {};

  kiosks.forEach((k) => {
    // 1. Actual database status count
    const dbStatus = (k.status || 'offline').toLowerCase();
    byDbStatus[dbStatus] = (byDbStatus[dbStatus] || 0) + 1;

    // 2. Separate connection indicator: fresh heartbeat within 5 minutes
    const heartbeatMs = k.last_heartbeat ? new Date(k.last_heartbeat).getTime() : 0;
    const isFresh = Boolean(k.last_heartbeat && !isNaN(heartbeatMs) && (now - heartbeatMs) <= 5 * 60 * 1000);
    if (isFresh) {
      connectedHeartbeats += 1;
    } else {
      staleHeartbeats += 1;
    }
  });

  return {
    totalKiosks: kiosks.length,
    connectedHeartbeats,
    staleHeartbeats,
    byDbStatus,
  };
}

/**
 * Main Service Query: Fetches and calculates all dashboard analytics
 * Security: Only selects non-sensitive columns; excludes payment_url, phonepe_transaction_id, session_token, file_path
 */
export async function fetchDashboardData(
  supabase: SupabaseClient,
  dateFilter: DateFilter = { preset: '30d' }
): Promise<DashboardData> {
  const { startDate, endDate } = getDateRangeBounds(
    dateFilter.preset,
    dateFilter.startDate,
    dateFilter.endDate
  );

  // 1. Fetch kiosks (only non-sensitive telemetry & profile fields)
  const { data: rawKiosks, error: kiosksError } = await supabase
    .from('kiosks')
    .select('id, kiosk_code, display_name, location, status, last_heartbeat, is_active, created_at')
    .order('kiosk_code', { ascending: true });

  if (kiosksError) {
    console.error('Error fetching kiosks:', kiosksError);
  }
  const kiosks: Kiosk[] = (rawKiosks as unknown as Kiosk[]) || [];

  // 2. Fetch orders (excludes payment_url, phonepe_transaction_id, file_path, tokens)
  let ordersQuery = supabase
    .from('orders')
    .select('id, kiosk_id, page_count, copies, color_print, print_sides, total_price, status, payment_status, created_at')
    .order('created_at', { ascending: false });

  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (endDate) {
    ordersQuery = ordersQuery.lte('created_at', endDate);
  }

  const { data: rawOrders, error: ordersError } = await ordersQuery;
  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
  }
  const orders: Order[] = (rawOrders as unknown as Order[]) || [];

  // 3. Fetch kiosk sessions (excludes file_path, session_token, payment_id)
  let sessionsQuery = supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, status, started_at, completed_at, created_at')
    .order('started_at', { ascending: false });

  if (startDate) {
    sessionsQuery = sessionsQuery.gte('started_at', startDate);
  }
  if (endDate) {
    sessionsQuery = sessionsQuery.lte('started_at', endDate);
  }

  const { data: rawSessions, error: sessionsError } = await sessionsQuery;
  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
  }
  const sessions: KioskSession[] = (rawSessions as unknown as KioskSession[]) || [];

  // Perform Calculations
  const overview = calculateOverviewMetrics(orders);
  const dailyAnalytics = calculateDailyAnalytics(orders, startDate, endDate);
  const kioskPerformance = calculateKioskPerformance(kiosks, orders);
  const peakHours = calculateHourlyAnalytics(orders);
  const printConfig = calculatePrintConfiguration(orders);
  const printDuration = calculatePrintDuration(sessions, kiosks);
  const kioskStatusSummary = calculateKioskStatusSummary(kiosks);

  return {
    overview,
    dailyAnalytics,
    kioskPerformance,
    peakHours,
    printConfig,
    printDuration,
    kioskStatusSummary,
    dateFilter,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch Recent Orders with filtering & pagination
 * Security: Strictly selects safe fields only (SafeOrder). Never selects payment_url, phonepe_transaction_id, file_path, payment_id
 */
export async function fetchRecentOrders(
  supabase: SupabaseClient,
  options: {
    limit?: number;
    offset?: number;
    kioskCode?: string;
    status?: string;
    search?: string;
    dateFilter?: DateFilter;
  } = {}
): Promise<{ orders: SafeOrder[]; totalCount: number }> {
  const { limit = 50, offset = 0, kioskCode, status, search, dateFilter } = options;

  let query = supabase
    .from('orders')
    .select('id, file_name, kiosk_id, page_count, copies, color_print, print_sides, total_price, payment_status, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (dateFilter) {
    const { startDate, endDate } = getDateRangeBounds(
      dateFilter.preset,
      dateFilter.startDate,
      dateFilter.endDate
    );
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
  }

  if (kioskCode && kioskCode !== 'all') {
    query = query.eq('kiosk_id', kioskCode);
  }

  if (status && status !== 'all') {
    query = query.eq('payment_status', status);
  }

  if (search && search.trim() !== '') {
    query = query.ilike('file_name', `%${search.trim()}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('Error fetching recent orders:', error);
    return { orders: [], totalCount: 0 };
  }

  return {
    orders: (data as unknown as SafeOrder[]) || [],
    totalCount: count || 0,
  };
}
