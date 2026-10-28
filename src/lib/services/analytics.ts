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
  KioskDetailData,
  PageCopyDistribution,
  KioskOperationalTelemetry,
  HistoricalComparisonMetrics,
  ReconciledJob,
} from '@/types/analytics';
import { Order, SafeOrder, SafeKioskSession, UnifiedJobLog, Kiosk, KioskSession } from '@/types/database';
import {
  getDateRangeBounds,
  formatDateLabel,
  getISTHour,
  getISTDateKey,
  getPreviousPeriodBounds,
  calculateComparisonDelta,
} from '@/lib/utils/date-helpers';

/**
 * Reconcile orders from `public.orders` and kiosk sessions from `public.kiosk_sessions`.
 *
 * Rules:
 * 1. If an order has a non-null `batch_id` matching a `kiosk_session.id`, they represent the SAME job.
 *    Deduplicate so it is counted exactly once (from the order).
 * 2. Sessions without a matching order are included as standalone kiosk sessions.
 * 3. Kiosks are matched via session.kiosk_id = kiosk.id (UUID) -> kiosk.kiosk_code.
 *    Web orders with kiosk_id = null are preserved without kiosk attribution.
 */
export function reconcileJobs(
  orders: Order[] = [],
  sessions: KioskSession[] = [],
  kiosks: Kiosk[] = []
): ReconciledJob[] {
  const kioskIdToCode = new Map<string, string>();
  const kioskCodeToId = new Map<string, string>();

  kiosks.forEach((k) => {
    kioskIdToCode.set(k.id, k.kiosk_code);
    kioskCodeToId.set(k.kiosk_code.toLowerCase(), k.id);
  });

  const jobs: ReconciledJob[] = [];
  const processedSessionIds = new Set<string>();

  // 1. Process all orders from public.orders
  for (const order of orders) {
    const kioskCode = order.kiosk_id || null;
    const kioskUuid = kioskCode ? kioskCodeToId.get(kioskCode.toLowerCase()) || null : null;

    if (order.batch_id) {
      processedSessionIds.add(order.batch_id);
    }

    jobs.push({
      id: order.id,
      source: 'order',
      orderId: order.id,
      sessionId: order.batch_id || undefined,
      kiosk_id: kioskCode,
      kiosk_uuid: kioskUuid,
      file_name: order.file_name,
      page_count: Number(order.page_count) || 0,
      copies: Number(order.copies) || 1,
      color_print: Boolean(order.color_print),
      print_sides: order.print_sides,
      total_price: Number(order.total_price) || 0,
      payment_status: (order.payment_status || 'pending').toLowerCase(),
      status: (order.status || 'processing').toLowerCase(),
      created_at: order.created_at,
      completed_at: order.payment_completed_at || order.updated_at,
    });
  }

  // 2. Process sessions from public.kiosk_sessions
  for (const session of sessions) {
    // Deduplication rule: do not recreate or double-count a session that already has a matching order
    if (processedSessionIds.has(session.id)) {
      continue;
    }

    const kioskCode = session.kiosk_id ? kioskIdToCode.get(session.kiosk_id) || null : null;
    const kioskUuid = session.kiosk_id || null;

    jobs.push({
      id: session.id,
      source: 'session',
      sessionId: session.id,
      kiosk_id: kioskCode,
      kiosk_uuid: kioskUuid,
      file_name: session.file_name,
      page_count: Number(session.page_count) || 0,
      copies: 1,
      color_print: false,
      print_sides: session.print_sides,
      total_price: Number(session.total_price) || 0,
      payment_status: (session.payment_status || 'pending').toLowerCase(),
      status: (session.status || 'pending').toLowerCase(),
      created_at: session.created_at || session.started_at || new Date().toISOString(),
      completed_at: session.completed_at,
    });
  }

  // Sort unified jobs strictly descending by created_at (newest first)
  jobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return jobs;
}

/**
 * 1. Overview KPI Metrics
 * Strict separated definitions:
 * - totalOrders: All reconciled jobs created within selected date range
 * - paidOrders: payment_status === 'completed'
 * - completedPrints: status === 'completed'
 * - cancelledOrders: status === 'cancelled'
 * - totalRevenue: calculated strictly from verified successful payments only
 * - totalPages: physical pages from completed prints of verified payments
 * - AOV: totalRevenue / paidOrders
 */
export function calculateOverviewMetrics(
  orders: Order[],
  sessions: KioskSession[] = [],
  kiosks: Kiosk[] = []
): OverviewMetrics {
  const jobs = reconcileJobs(orders, sessions, kiosks);
  const totalOrders = jobs.length;

  // Strict payment separation: Successful payment != successful print
  const paidJobs = jobs.filter((j) => j.payment_status === 'completed');
  const paidOrders = paidJobs.length;

  const completedPrints = jobs.filter((j) => j.status === 'completed').length;
  const cancelledOrders = jobs.filter((j) => j.status === 'cancelled').length;

  // Revenue strictly from verified successful payments only
  const totalRevenue = paidJobs.reduce((sum, j) => sum + j.total_price, 0);

  // Pages printed strictly from verified completed physical prints
  const totalPages = paidJobs
    .filter((j) => j.status === 'completed')
    .reduce((sum, j) => sum + j.page_count * j.copies, 0);

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
    totalSessions: sessions.length,
    completedSessions: sessions.filter((s) => s.status === 'completed').length,
    expiredSessions: sessions.filter((s) => s.status === 'expired').length,
  };
}

/**
 * 2. Daily Analytics (Orders, Revenue, Pages printed per day in Asia/Kolkata)
 */
export function calculateDailyAnalytics(
  orders: Order[],
  startDate: string | null,
  endDate: string | null,
  sessions: KioskSession[] = [],
  kiosks: Kiosk[] = []
): DailyAnalyticsItem[] {
  const jobs = reconcileJobs(orders, sessions, kiosks);
  const dailyMap: { [dateStr: string]: { orders: number; revenue: number; pages: number } } = {};

  // Build a calendar template if within date range
  if (startDate && endDate) {
    const startKey = getISTDateKey(startDate);
    const endKey = getISTDateKey(endDate);
    const cur = new Date(`${startKey}T12:00:00+05:30`);
    const end = new Date(`${endKey}T12:00:00+05:30`);

    const maxLoops = 120;
    let loops = 0;
    while (cur <= end && loops < maxLoops) {
      const key = getISTDateKey(cur);
      dailyMap[key] = { orders: 0, revenue: 0, pages: 0 };
      cur.setDate(cur.getDate() + 1);
      loops++;
    }
  }

  // Populate actual data
  jobs.forEach((j) => {
    if (!j.created_at) return;
    const dateKey = getISTDateKey(j.created_at);
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { orders: 0, revenue: 0, pages: 0 };
    }
    dailyMap[dateKey].orders += 1;

    if (j.payment_status === 'completed') {
      dailyMap[dateKey].revenue += j.total_price;
      if (j.status === 'completed') {
        dailyMap[dateKey].pages += j.page_count * j.copies;
      }
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
 * Uses reconciled records attributing jobs strictly to kiosks (kiosk_code or kiosk_id).
 * Web orders with kiosk_id = null are NEVER attributed to any kiosk.
 */
export function calculateKioskPerformance(
  kiosks: Kiosk[],
  orders: Order[],
  sessions: KioskSession[] = []
): KioskPerformanceItem[] {
  const jobs = reconcileJobs(orders, sessions, kiosks);

  return kiosks.map((kiosk) => {
    const kioskJobs = jobs.filter(
      (j) =>
        (j.kiosk_id && j.kiosk_id.toLowerCase() === kiosk.kiosk_code.toLowerCase()) ||
        (j.kiosk_uuid && j.kiosk_uuid === kiosk.id)
    );

    const paidKioskJobs = kioskJobs.filter((j) => j.payment_status === 'completed');
    const completedPrints = kioskJobs.filter((j) => j.status === 'completed').length;

    const paidOrdersCount = paidKioskJobs.length;
    const revenue = paidKioskJobs.reduce((sum, j) => sum + j.total_price, 0);
    const pagesPrinted = paidKioskJobs
      .filter((j) => j.status === 'completed')
      .reduce((sum, j) => sum + j.page_count * j.copies, 0);

    const avgOrderValue = paidOrdersCount > 0 ? revenue / paidOrdersCount : 0;

    // Derived connection indicator: fresh heartbeat within 5 minutes (300,000 ms)
    const now = Date.now();
    const heartbeatMs = kiosk.last_heartbeat ? new Date(kiosk.last_heartbeat).getTime() : 0;
    const isHeartbeatFresh = Boolean(kiosk.last_heartbeat && !isNaN(heartbeatMs) && now - heartbeatMs <= 5 * 60 * 1000);

    return {
      id: kiosk.id,
      kiosk_code: kiosk.kiosk_code,
      display_name: kiosk.display_name || kiosk.kiosk_code,
      location: kiosk.location || 'Unknown',
      status: kiosk.status || 'offline',
      last_heartbeat: kiosk.last_heartbeat || null,
      connectionIndicator: isHeartbeatFresh ? 'online' : 'stale',
      connectionLabel: isHeartbeatFresh ? 'Heartbeat Online' : 'Heartbeat Stale',
      is_active: kiosk.is_active ?? false,
      paidOrders: paidOrdersCount,
      completedPrints,
      pagesPrinted,
      revenue: Math.round(revenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    };
  });
}

/**
 * 4. Peak Hours (00:00 to 23:00 IST)
 * Uses completed/paid jobs bucketed into Asia/Kolkata timezone
 */
export function calculateHourlyAnalytics(
  orders: Order[],
  sessions: KioskSession[] = [],
  kiosks: Kiosk[] = []
): HourlyVolumeItem[] {
  const jobs = reconcileJobs(orders, sessions, kiosks);
  const hourlyMap: { [hour: number]: { orders: number; revenue: number } } = {};

  for (let h = 0; h < 24; h++) {
    hourlyMap[h] = { orders: 0, revenue: 0 };
  }

  const paidJobs = jobs.filter((j) => j.payment_status === 'completed');

  paidJobs.forEach((j) => {
    if (!j.created_at) return;
    const date = new Date(j.created_at);
    if (isNaN(date.getTime())) return;
    const hour = getISTHour(date);
    hourlyMap[hour].orders += 1;
    hourlyMap[hour].revenue += j.total_price;
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
 * Black & White vs Color, Single-sided vs Double-sided (completed/paid jobs)
 */
export function calculatePrintConfiguration(
  orders: Order[],
  sessions: KioskSession[] = [],
  kiosks: Kiosk[] = []
): PrintConfigMetrics {
  const jobs = reconcileJobs(orders, sessions, kiosks);
  const paidJobs = jobs.filter((j) => j.payment_status === 'completed');

  let bwOrders = 0;
  let colorOrders = 0;
  let singleSidedOrders = 0;
  let doubleSidedOrders = 0;

  paidJobs.forEach((j) => {
    if (j.color_print) {
      colorOrders += 1;
    } else {
      bwOrders += 1;
    }

    const sides = (j.print_sides || '').toLowerCase().trim();
    if (sides.includes('double') || sides.includes('duplex') || sides === 'both') {
      doubleSidedOrders += 1;
    } else {
      singleSidedOrders += 1;
    }
  });

  return {
    bwOrders,
    colorOrders,
    singleSidedOrders,
    doubleSidedOrders,
    totalConfigOrders: paidJobs.length,
  };
}

/**
 * 6. Print Duration
 * Uses kiosk_sessions: status = 'completed' AND completed_at IS NOT NULL
 * Duration: completed_at - started_at in seconds
 */
export function calculatePrintDuration(sessions: KioskSession[], kiosks: Kiosk[]): PrintDurationMetrics {
  const validSessions = sessions.filter(
    (s) => s.status === 'completed' && s.completed_at && s.started_at
  );

  const durations: number[] = [];
  const kioskMap: { [kioskId: string]: number[] } = {};

  validSessions.forEach((s) => {
    const start = new Date(s.started_at!).getTime();
    const end = new Date(s.completed_at!).getTime();
    const diffSecs = (end - start) / 1000;

    if (diffSecs >= 0 && diffSecs < 7200) {
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
 * 7. Kiosk Status Summary
 * Clearly separates actual database status from connection heartbeat indicator
 */
export function calculateKioskStatusSummary(kiosks: Kiosk[]): KioskStatusSummary {
  const now = Date.now();
  let connectedHeartbeats = 0;
  let staleHeartbeats = 0;
  const byDbStatus: { [status: string]: number } = {};

  kiosks.forEach((k) => {
    const dbStatus = (k.status || 'offline').toLowerCase();
    byDbStatus[dbStatus] = (byDbStatus[dbStatus] || 0) + 1;

    const heartbeatMs = k.last_heartbeat ? new Date(k.last_heartbeat).getTime() : 0;
    const isFresh = Boolean(k.last_heartbeat && !isNaN(heartbeatMs) && now - heartbeatMs <= 5 * 60 * 1000);
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

  // 1. Fetch kiosks
  const { data: rawKiosks, error: kiosksError } = await supabase
    .from('kiosks')
    .select('id, kiosk_code, display_name, location, status, last_heartbeat, is_active, created_at')
    .order('kiosk_code', { ascending: true });

  if (kiosksError) {
    console.error('Error fetching kiosks:', kiosksError);
    throw new Error(`Database error retrieving kiosk fleet: ${kiosksError.message}`);
  }
  const kiosks: Kiosk[] = (rawKiosks as unknown as Kiosk[]) || [];

  // 2. Fetch orders
  let ordersQuery = supabase
    .from('orders')
    .select('id, file_name, kiosk_id, page_count, copies, color_print, print_sides, total_price, status, payment_status, created_at, updated_at, payment_completed_at, batch_id')
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
    throw new Error(`Database error retrieving orders: ${ordersError.message}`);
  }
  const orders: Order[] = (rawOrders as unknown as Order[]) || [];

  // 3. Fetch kiosk sessions using consistent created_at boundary
  let sessionsQuery = supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, status, payment_status, total_price, page_count, print_sides, file_name, started_at, completed_at, created_at')
    .order('created_at', { ascending: false });

  if (startDate) {
    sessionsQuery = sessionsQuery.gte('created_at', startDate);
  }
  if (endDate) {
    sessionsQuery = sessionsQuery.lte('created_at', endDate);
  }

  const { data: rawSessions, error: sessionsError } = await sessionsQuery;
  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
    throw new Error(`Database error retrieving kiosk sessions: ${sessionsError.message}`);
  }
  const sessions: KioskSession[] = (rawSessions as unknown as KioskSession[]) || [];

  // Perform Calculations using reconciled server-side datasets
  const overview = calculateOverviewMetrics(orders, sessions, kiosks);
  const dailyAnalytics = calculateDailyAnalytics(orders, startDate, endDate, sessions, kiosks);
  const kioskPerformance = calculateKioskPerformance(kiosks, orders, sessions);
  const peakHours = calculateHourlyAnalytics(orders, sessions, kiosks);
  const printConfig = calculatePrintConfiguration(orders, sessions, kiosks);
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
    status?: string; // payment_status
    printStatus?: string; // status ('completed' | 'processing' | 'cancelled')
    search?: string;
    dateFilter?: DateFilter;
  } = {}
): Promise<{ orders: SafeOrder[]; totalCount: number }> {
  const { limit = 50, offset = 0, kioskCode, status, printStatus, search, dateFilter } = options;

  let query = supabase
    .from('orders')
    .select('id, file_name, kiosk_id, batch_id, page_count, copies, color_print, print_sides, total_price, payment_status, status, created_at', { count: 'exact' })
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

  if (printStatus && printStatus !== 'all') {
    query = query.eq('status', printStatus);
  }

  if (search && search.trim() !== '') {
    query = query.ilike('file_name', `%${search.trim()}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('Error fetching recent orders:', error);
    throw new Error(`Database error querying recent orders: ${error.message}`);
  }

  return {
    orders: (data as unknown as SafeOrder[]) || [],
    totalCount: count || 0,
  };
}

/**
 * Fetch Recent Kiosk Sessions with filtering & pagination
 * Security: Strictly selects safe fields only (SafeKioskSession).
 * Never selects session_token, file_path, file_paths, or payment_id.
 */
export async function fetchRecentKioskSessions(
  supabase: SupabaseClient,
  options: {
    limit?: number;
    offset?: number;
    kioskCode?: string;
    status?: string; // session status: 'completed' | 'cancelled' | 'expired'
    paymentStatus?: string;
    search?: string;
    dateFilter?: DateFilter;
  } = {}
): Promise<{ sessions: SafeKioskSession[]; totalCount: number }> {
  const { limit = 50, offset = 0, kioskCode, status, paymentStatus, search, dateFilter } = options;

  // 1. Fetch kiosks to map UUID to kiosk_code & display_name
  const { data: kiosksData, error: kiosksError } = await supabase
    .from('kiosks')
    .select('id, kiosk_code, display_name');

  if (kiosksError) {
    throw new Error(`Database error querying kiosks: ${kiosksError.message}`);
  }

  const kioskMap = new Map<string, { kiosk_code: string; display_name: string }>();
  let filterKioskUuid: string | undefined;

  for (const k of (kiosksData || [])) {
    kioskMap.set(k.id, { kiosk_code: k.kiosk_code, display_name: k.display_name });
    if (kioskCode && kioskCode !== 'all' && k.kiosk_code.toLowerCase() === kioskCode.toLowerCase()) {
      filterKioskUuid = k.id;
    }
  }

  // If a specific kioskCode was requested but doesn't exist in kiosks table
  if (kioskCode && kioskCode !== 'all' && !filterKioskUuid) {
    return { sessions: [], totalCount: 0 };
  }

  let query = supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, file_name, page_count, print_sides, total_price, payment_status, status, created_at, expires_at, completed_at', { count: 'exact' })
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

  if (filterKioskUuid) {
    query = query.eq('kiosk_id', filterKioskUuid);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (paymentStatus && paymentStatus !== 'all') {
    query = query.eq('payment_status', paymentStatus);
  }

  if (search && search.trim() !== '') {
    query = query.ilike('file_name', `%${search.trim()}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('Error fetching kiosk sessions:', error);
    throw new Error(`Database error querying kiosk sessions: ${error.message}`);
  }

  const sessions: SafeKioskSession[] = (data || []).map((row) => {
    const kInfo = kioskMap.get(row.kiosk_id);
    return {
      id: row.id,
      kiosk_id: row.kiosk_id,
      kiosk_code: kInfo?.kiosk_code || 'unknown',
      kiosk_name: kInfo?.display_name || undefined,
      status: row.status,
      payment_status: row.payment_status,
      total_price: Number(row.total_price) || 0,
      page_count: row.page_count ?? 1,
      print_sides: row.print_sides,
      file_name: row.file_name,
      created_at: row.created_at,
      expires_at: row.expires_at,
      completed_at: row.completed_at,
    };
  });

  return {
    sessions,
    totalCount: count || 0,
  };
}

/**
 * Fetch Unified Recent Jobs (Reconciled public.orders + public.kiosk_sessions)
 * Deduplicates using kiosk_sessions.id = orders.batch_id.
 */
export async function fetchUnifiedRecentJobs(
  supabase: SupabaseClient,
  options: {
    limit?: number;
    offset?: number;
    kioskCode?: string;
    status?: string; // payment_status
    printStatus?: string; // status ('completed' | 'processing' | 'cancelled' | 'expired')
    search?: string;
    dateFilter?: DateFilter;
  } = {}
): Promise<{ jobs: UnifiedJobLog[]; totalCount: number }> {
  const { limit = 50, offset = 0, kioskCode, status, printStatus, search, dateFilter } = options;

  // 1. Fetch kiosks
  const { data: rawKiosks, error: kiosksError } = await supabase
    .from('kiosks')
    .select('id, kiosk_code, display_name');

  if (kiosksError) {
    throw new Error(`Database error querying kiosks: ${kiosksError.message}`);
  }
  const kiosks = (rawKiosks || []) as Kiosk[];
  const kioskMap = new Map<string, Kiosk>();
  const kioskCodeMap = new Map<string, Kiosk>();
  for (const k of kiosks) {
    kioskMap.set(k.id, k);
    kioskCodeMap.set(k.kiosk_code.toLowerCase(), k);
  }

  // 2. Fetch orders and sessions within date bounds
  const { startDate, endDate } = dateFilter
    ? getDateRangeBounds(dateFilter.preset, dateFilter.startDate, dateFilter.endDate)
    : { startDate: null, endDate: null };

  let ordersQuery = supabase
    .from('orders')
    .select('id, file_name, kiosk_id, batch_id, page_count, copies, color_print, print_sides, total_price, payment_status, status, created_at, completed_at:payment_completed_at')
    .order('created_at', { ascending: false });

  if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate);
  if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate);
  if (kioskCode && kioskCode !== 'all') {
    ordersQuery = ordersQuery.eq('kiosk_id', kioskCode);
  }

  let sessionsQuery = supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, file_name, page_count, print_sides, total_price, payment_status, status, created_at, completed_at')
    .order('created_at', { ascending: false });

  if (startDate) sessionsQuery = sessionsQuery.gte('created_at', startDate);
  if (endDate) sessionsQuery = sessionsQuery.lte('created_at', endDate);
  if (kioskCode && kioskCode !== 'all') {
    const kEntity = kioskCodeMap.get(kioskCode.toLowerCase());
    if (kEntity) {
      sessionsQuery = sessionsQuery.eq('kiosk_id', kEntity.id);
    } else {
      sessionsQuery = sessionsQuery.eq('kiosk_id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const [ordersRes, sessionsRes] = await Promise.all([ordersQuery, sessionsQuery]);

  if (ordersRes.error) {
    throw new Error(`Database error querying orders: ${ordersRes.error.message}`);
  }
  if (sessionsRes.error) {
    throw new Error(`Database error querying sessions: ${sessionsRes.error.message}`);
  }

  const reconciled = reconcileJobs(
    (ordersRes.data || []) as unknown as Order[],
    (sessionsRes.data || []) as unknown as KioskSession[],
    kiosks
  );

  // Apply filters on unified reconciled jobs
  let filtered = reconciled;

  if (status && status !== 'all') {
    filtered = filtered.filter((j) => (j.payment_status || '').toLowerCase() === status.toLowerCase());
  }

  if (printStatus && printStatus !== 'all') {
    filtered = filtered.filter((j) => (j.status || '').toLowerCase() === printStatus.toLowerCase());
  }

  if (search && search.trim() !== '') {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter((j) => (j.file_name || '').toLowerCase().includes(s));
  }

  const totalCount = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  const jobs: UnifiedJobLog[] = paged.map((j) => {
    const kEntity = j.kiosk_uuid ? kioskMap.get(j.kiosk_uuid) : (j.kiosk_id ? kioskCodeMap.get(j.kiosk_id.toLowerCase()) : undefined);
    const source: 'order' | 'kiosk_session' | 'reconciled' =
      j.orderId && j.sessionId ? 'reconciled' : (j.orderId ? 'order' : 'kiosk_session');

    return {
      id: j.id,
      source,
      file_name: j.file_name || (j.source === 'session' ? 'kiosk-session' : 'print-job'),
      kiosk_id: j.kiosk_id,
      kiosk_name: kEntity?.display_name || undefined,
      page_count: j.page_count ?? 1,
      copies: j.copies ?? 1,
      color_print: j.color_print ?? false,
      print_sides: j.print_sides ?? 'single',
      total_price: j.total_price ?? 0,
      payment_status: j.payment_status,
      status: j.status,
      created_at: j.created_at,
      completed_at: j.completed_at,
      batch_id: j.sessionId || undefined,
    };
  });

  return {
    jobs,
    totalCount,
  };
}

/**
 * Fetch Dedicated Kiosk Dashboard Analytics
 * Scoped strictly to the selected kiosk machine, matching orders.kiosk_id = kiosks.kiosk_code
 * and kiosk_sessions.kiosk_id = kiosks.id (UUID), properly reconciled.
 */
export async function fetchKioskDashboardData(
  supabase: SupabaseClient,
  kioskCode: string,
  dateFilter: DateFilter = { preset: '30d' }
): Promise<KioskDetailData | null> {
  // 1. Fetch kiosk entity
  const { data: rawKiosk, error: kioskError } = await supabase
    .from('kiosks')
    .select('id, kiosk_code, display_name, location, status, last_heartbeat, is_active, created_at')
    .ilike('kiosk_code', kioskCode)
    .maybeSingle();

  if (kioskError) {
    console.error(`Error querying kiosk '${kioskCode}':`, kioskError);
    throw new Error(`Database error querying kiosk '${kioskCode}': ${kioskError.message}`);
  }
  if (!rawKiosk) {
    return null;
  }

  const kiosk = rawKiosk as Kiosk;

  // Connection indicator: 5-minute heartbeat check
  const now = Date.now();
  const heartbeatMs = kiosk.last_heartbeat ? new Date(kiosk.last_heartbeat).getTime() : 0;
  const isHeartbeatFresh = Boolean(kiosk.last_heartbeat && !isNaN(heartbeatMs) && now - heartbeatMs <= 5 * 60 * 1000);

  // 2. Date range bounds
  const { startDate, endDate } = getDateRangeBounds(
    dateFilter.preset,
    dateFilter.startDate,
    dateFilter.endDate
  );

  // 3. Fetch orders strictly matching this kiosk's kiosk_code
  let ordersQuery = supabase
    .from('orders')
    .select('id, file_name, kiosk_id, page_count, copies, color_print, print_sides, total_price, status, payment_status, created_at, updated_at, payment_completed_at, batch_id')
    .eq('kiosk_id', kiosk.kiosk_code)
    .order('created_at', { ascending: false });

  if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate);
  if (endDate) ordersQuery = ordersQuery.lte('created_at', endDate);

  const { data: rawOrders, error: ordersError } = await ordersQuery;
  if (ordersError) {
    console.error(`Error fetching orders for kiosk ${kioskCode}:`, ordersError);
    throw new Error(`Database error fetching orders for kiosk ${kioskCode}: ${ordersError.message}`);
  }
  const orders: Order[] = (rawOrders as unknown as Order[]) || [];

  // 4. Fetch kiosk sessions strictly matching kiosk.id (UUID)
  let sessionsQuery = supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, status, payment_status, total_price, page_count, print_sides, file_name, started_at, completed_at, created_at')
    .eq('kiosk_id', kiosk.id)
    .order('created_at', { ascending: false });

  if (startDate) sessionsQuery = sessionsQuery.gte('created_at', startDate);
  if (endDate) sessionsQuery = sessionsQuery.lte('created_at', endDate);

  const { data: rawSessions, error: sessionsError } = await sessionsQuery;
  if (sessionsError) {
    console.error(`Error fetching sessions for kiosk ${kioskCode}:`, sessionsError);
    throw new Error(`Database error fetching sessions for kiosk ${kioskCode}: ${sessionsError.message}`);
  }
  const sessions: KioskSession[] = (rawSessions as unknown as KioskSession[]) || [];

  // Reconcile jobs strictly for this kiosk
  const kioskJobs = reconcileJobs(orders, sessions, [kiosk]).filter(
    (j) =>
      (j.kiosk_id && j.kiosk_id.toLowerCase() === kiosk.kiosk_code.toLowerCase()) ||
      (j.kiosk_uuid && j.kiosk_uuid === kiosk.id)
  );

  // 5. Calculate Overview Metrics
  const overview = calculateOverviewMetrics(orders, sessions, [kiosk]);

  // 6. Calculate Historical Comparison (vs previous equivalent period)
  const { prevStartDate, prevEndDate, label: prevLabel } = getPreviousPeriodBounds(
    dateFilter.preset,
    startDate,
    endDate
  );

  let historicalComparison: HistoricalComparisonMetrics = {
    hasBaseline: false,
    previousPeriodLabel: prevLabel,
    revenueDelta: { percentage: null, changeType: 'no-baseline', formatted: 'No prior baseline', prevValue: 0 },
    ordersDelta: { percentage: null, changeType: 'no-baseline', formatted: 'No prior baseline', prevValue: 0 },
    pagesDelta: { percentage: null, changeType: 'no-baseline', formatted: 'No prior baseline', prevValue: 0 },
    paidOrdersDelta: { percentage: null, changeType: 'no-baseline', formatted: 'No prior baseline', prevValue: 0 },
  };

  if (prevStartDate && prevEndDate) {
    const { data: rawPrevOrders, error: prevOrdersError } = await supabase
      .from('orders')
      .select('id, file_name, kiosk_id, page_count, copies, color_print, print_sides, total_price, status, payment_status, created_at, updated_at, payment_completed_at, batch_id')
      .eq('kiosk_id', kiosk.kiosk_code)
      .gte('created_at', prevStartDate)
      .lte('created_at', prevEndDate);

    if (prevOrdersError) {
      console.error('Error fetching prev orders for baseline comparison:', prevOrdersError);
    }

    const { data: rawPrevSessions, error: prevSessionsError } = await supabase
      .from('kiosk_sessions')
      .select('id, kiosk_id, status, payment_status, total_price, page_count, print_sides, file_name, started_at, completed_at, created_at')
      .eq('kiosk_id', kiosk.id)
      .gte('created_at', prevStartDate)
      .lte('created_at', prevEndDate);

    if (prevSessionsError) {
      console.error('Error fetching prev sessions for baseline comparison:', prevSessionsError);
    }

    const prevOrders = (rawPrevOrders as unknown as Order[]) || [];
    const prevSessions = (rawPrevSessions as unknown as KioskSession[]) || [];
    const prevOverview = calculateOverviewMetrics(prevOrders, prevSessions, [kiosk]);

    historicalComparison = {
      hasBaseline: true,
      previousPeriodLabel: prevLabel,
      revenueDelta: calculateComparisonDelta(overview.totalRevenue, prevOverview.totalRevenue),
      ordersDelta: calculateComparisonDelta(overview.totalOrders, prevOverview.totalOrders),
      pagesDelta: calculateComparisonDelta(overview.totalPages, prevOverview.totalPages),
      paidOrdersDelta: calculateComparisonDelta(overview.paidOrders, prevOverview.paidOrders),
    };
  }

  // 7. Calculate Page and Copy distribution from paid reconciled jobs
  const paidKioskJobs = kioskJobs.filter((j) => j.payment_status === 'completed');
  let singlePageOrders = 0;
  let smallJobOrders = 0;
  let mediumJobOrders = 0;
  let largeJobOrders = 0;
  let singleCopyOrders = 0;
  let multiCopyOrders = 0;
  let totalCopiesSum = 0;

  paidKioskJobs.forEach((j) => {
    const p = Number(j.page_count) || 1;
    const c = Number(j.copies) || 1;
    totalCopiesSum += c;

    if (p === 1) singlePageOrders++;
    else if (p <= 5) smallJobOrders++;
    else if (p <= 10) mediumJobOrders++;
    else largeJobOrders++;

    if (c === 1) singleCopyOrders++;
    else multiCopyOrders++;
  });

  const pageCopyDistribution: PageCopyDistribution = {
    singlePageOrders,
    smallJobOrders,
    mediumJobOrders,
    largeJobOrders,
    singleCopyOrders,
    multiCopyOrders,
    avgCopies: paidKioskJobs.length > 0 ? Math.round((totalCopiesSum / paidKioskJobs.length) * 10) / 10 : 1,
  };

  // 8. Calculate Operational Performance
  const completedJobsList = kioskJobs.filter((j) => j.status === 'completed');
  const completedJobs = completedJobsList.length;
  const cancelledJobs = kioskJobs.filter((j) => j.status === 'cancelled').length;
  const processingOrders = kioskJobs.filter(
    (j) => j.status === 'processing' || j.status === 'printing'
  ).length;
  const paidPendingPrintOrders = kioskJobs.filter(
    (j) => j.payment_status === 'completed' && j.status !== 'completed' && j.status !== 'cancelled'
  ).length;

  let latestSuccessfulPrint: string | null = null;
  if (completedJobsList.length > 0) {
    const sortedCompleted = [...completedJobsList].sort((a, b) => {
      const timeA = new Date(a.completed_at || a.created_at).getTime();
      const timeB = new Date(b.completed_at || b.created_at).getTime();
      return timeB - timeA;
    });
    latestSuccessfulPrint = sortedCompleted[0].completed_at || sortedCompleted[0].created_at || null;
  }

  // Physical duration telemetry from kiosk_sessions
  const validSessions = sessions.filter(
    (s) => s.status === 'completed' && s.completed_at && s.started_at
  );
  const sessionDurations: number[] = [];
  validSessions.forEach((s) => {
    const diffSecs = (new Date(s.completed_at!).getTime() - new Date(s.started_at!).getTime()) / 1000;
    if (diffSecs >= 0 && diffSecs < 7200) {
      sessionDurations.push(diffSecs);
    }
  });

  const durationSessionCount = sessionDurations.length;
  const hasDurationTelemetry = durationSessionCount > 0;
  const avgDurationSeconds = hasDurationTelemetry
    ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / durationSessionCount)
    : 0;
  const minDurationSeconds = hasDurationTelemetry ? Math.round(Math.min(...sessionDurations)) : 0;
  const maxDurationSeconds = hasDurationTelemetry ? Math.round(Math.max(...sessionDurations)) : 0;

  const operational: KioskOperationalTelemetry = {
    completedJobs,
    cancelledJobs,
    processingOrders,
    paidPendingPrintOrders,
    latestSuccessfulPrint,
    hasDurationTelemetry,
    avgDurationSeconds,
    minDurationSeconds,
    maxDurationSeconds,
    durationSessionCount,
  };

  // 9. Sub-analytics
  const dailyAnalytics = calculateDailyAnalytics(orders, startDate, endDate, sessions, [kiosk]);
  const hourlyDemand = calculateHourlyAnalytics(orders, sessions, [kiosk]);
  const printConfig = calculatePrintConfiguration(orders, sessions, [kiosk]);

  return {
    kiosk: {
      id: kiosk.id,
      kiosk_code: kiosk.kiosk_code,
      display_name: kiosk.display_name || kiosk.kiosk_code,
      location: kiosk.location || 'Unspecified',
      status: kiosk.status || 'offline',
      last_heartbeat: kiosk.last_heartbeat || null,
      connectionIndicator: isHeartbeatFresh ? 'online' : 'stale',
      connectionLabel: isHeartbeatFresh ? 'Heartbeat Online' : 'Heartbeat Stale',
      is_active: kiosk.is_active ?? false,
    },
    overview,
    dailyAnalytics,
    hourlyDemand,
    printConfig,
    pageCopyDistribution,
    operational,
    historicalComparison,
    dateFilter,
    lastUpdated: new Date().toISOString(),
  };
}
