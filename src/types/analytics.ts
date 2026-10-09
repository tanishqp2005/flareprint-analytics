export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all' | 'custom';

export type DateFilter = {
  preset: DateRangePreset;
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
};

export type OverviewMetrics = {
  totalOrders: number;       // All orders created within date range
  paidOrders: number;        // Orders with payment_status === 'completed'
  completedPrints: number;   // Orders with status === 'completed'
  cancelledOrders: number;   // Orders with status === 'cancelled'
  totalRevenue: number;      // Calculated strictly from paidOrders
  totalPages: number;        // Calculated strictly from paidOrders (page_count * copies)
  avgOrderValue: number;     // totalRevenue / paidOrders
  avgPagesPerOrder: number;  // totalPages / paidOrders
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
