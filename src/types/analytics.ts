export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all' | 'custom';

export type DateFilter = {
  preset: DateRangePreset;
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
};

export interface ReconciledJob {
  id: string;
  source: 'order' | 'session';
  orderId?: string;
  sessionId?: string;
  kiosk_id: string | null;
  kiosk_uuid: string | null;
  file_name?: string | null;
  page_count: number;
  copies: number;
  color_print: boolean;
  print_sides?: string | null;
  total_price: number;
  payment_status: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
}

export type OverviewMetrics = {
  totalOrders: number;       // All orders created within date range
  paidOrders: number;        // Orders with payment_status === 'completed'
  completedPrints: number;   // Orders with status === 'completed'
  cancelledOrders: number;   // Orders with status === 'cancelled'
  totalRevenue: number;      // Calculated strictly from paidOrders
  totalPages: number;        // Calculated strictly from paidOrders (page_count * copies)
  avgOrderValue: number;     // totalRevenue / paidOrders
  avgPagesPerOrder: number;  // totalPages / paidOrders
  totalSessions?: number;    // Total kiosk sessions recorded
  completedSessions?: number; // Total completed kiosk sessions
  expiredSessions?: number;  // Total expired kiosk sessions
};

export type DailyAnalyticsItem = {
  date: string;
  formattedDate: string;
  orders: number;
  revenue: number;
  pages: number;
};

export type KioskPerformanceItem = {
  id: string;
  kiosk_code: string;
  display_name: string;
  location: string;
  status: string; // Actual kiosks.status from database
  last_heartbeat: string | null;
  connectionIndicator: 'online' | 'stale'; // Derived from heartbeat within 5 minutes
  connectionLabel: string; // 'Heartbeat Online' or 'Heartbeat Stale'
  is_active: boolean;
  paidOrders: number;
  completedPrints: number; // Physical prints with status === 'completed'
  pagesPrinted: number;
  revenue: number;
  avgOrderValue: number;
};

export type HourlyVolumeItem = {
  hour: string; // '00:00' to '23:00'
  hourNumber: number; // 0 to 23
  orders: number;
  revenue: number;
};

export type PrintConfigMetrics = {
  bwOrders: number;
  colorOrders: number;
  singleSidedOrders: number;
  doubleSidedOrders: number;
  totalConfigOrders: number;
};

export type PageCopyDistribution = {
  singlePageOrders: number;
  smallJobOrders: number; // 2-5 pages
  mediumJobOrders: number; // 6-10 pages
  largeJobOrders: number; // 11+ pages
  singleCopyOrders: number;
  multiCopyOrders: number;
  avgCopies: number;
};

export type KioskOperationalTelemetry = {
  completedJobs: number;
  cancelledJobs: number;
  processingOrders: number;
  paidPendingPrintOrders: number;
  latestSuccessfulPrint: string | null;
  hasDurationTelemetry: boolean;
  avgDurationSeconds: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  durationSessionCount: number;
};

export type ComparisonDelta = {
  percentage: number | null;
  changeType: 'increase' | 'decrease' | 'neutral' | 'no-baseline';
  formatted: string;
  prevValue: number;
};

export type HistoricalComparisonMetrics = {
  hasBaseline: boolean;
  previousPeriodLabel: string;
  revenueDelta: ComparisonDelta;
  ordersDelta: ComparisonDelta;
  pagesDelta: ComparisonDelta;
  paidOrdersDelta: ComparisonDelta;
};

export type KioskDetailData = {
  kiosk: {
    id: string;
    kiosk_code: string;
    display_name: string;
    location: string;
    status: string;
    last_heartbeat: string | null;
    connectionIndicator: 'online' | 'stale';
    connectionLabel: string;
    is_active: boolean;
  };
  overview: OverviewMetrics;
  dailyAnalytics: DailyAnalyticsItem[];
  hourlyDemand: HourlyVolumeItem[];
  printConfig: PrintConfigMetrics;
  pageCopyDistribution: PageCopyDistribution;
  operational: KioskOperationalTelemetry;
  historicalComparison: HistoricalComparisonMetrics;
  dateFilter: DateFilter;
  lastUpdated: string;
};

export type KioskDurationItem = {
  kiosk_id: string;
  kiosk_code: string;
  display_name: string;
  sessionCount: number;
  avgDurationSeconds: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
};

export type PrintDurationMetrics = {
  overallAvgSeconds: number;
  overallMinSeconds: number;
  overallMaxSeconds: number;
  completedSessionsCount: number;
  byKiosk: KioskDurationItem[];
};

export type KioskStatusSummary = {
  totalKiosks: number;
  connectedHeartbeats: number; // Heartbeat within 5 minutes
  staleHeartbeats: number;     // Heartbeat older than 5 minutes or missing
  byDbStatus: { [status: string]: number }; // Actual database status distribution
};

export type DashboardData = {
  overview: OverviewMetrics;
  dailyAnalytics: DailyAnalyticsItem[];
  kioskPerformance: KioskPerformanceItem[];
  peakHours: HourlyVolumeItem[];
  printConfig: PrintConfigMetrics;
  printDuration: PrintDurationMetrics;
  kioskStatusSummary: KioskStatusSummary;
  dateFilter: DateFilter;
  lastUpdated: string;
};
