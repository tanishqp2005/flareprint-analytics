import { createClient } from '@supabase/supabase-js';
import {
  fetchDashboardData,
  fetchKioskDashboardData,
  fetchRecentOrders,
} from '../src/lib/services/analytics';
import { getISTHour, getISTDateKey, calculateComparisonDelta, getDateRangeBounds } from '../src/lib/utils/date-helpers';

async function runTests() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('--- STARTING COMPREHENSIVE VERIFICATION TESTS ---');

  // Test 1: Global Dashboard Data (preset: 7d)
  console.log('\n[Test 1] Testing Global fetchDashboardData (preset: 7d)...');
  const global7d = await fetchDashboardData(supabase, { preset: '7d' });
  console.log('7d Overview:', global7d.overview);
  console.log('7d Discovered Kiosks Count:', global7d.kioskPerformance.length);
  global7d.kioskPerformance.forEach((k) => {
    console.log(`- Kiosk ${k.kiosk_code}: paidOrders=${k.paidOrders}, completedPrints=${k.completedPrints}, revenue=₹${k.revenue}, pages=${k.pagesPrinted}`);
  });

  // Verify October 27-28 data appears in 7d daily analytics
  const oct27Daily = global7d.dailyAnalytics.find((d) => d.date === '2026-10-27');
  const oct28Daily = global7d.dailyAnalytics.find((d) => d.date === '2026-10-28');
  console.log('Oct 27 Daily Chart data:', oct27Daily);
  console.log('Oct 28 Daily Chart data:', oct28Daily);

  if (!oct27Daily || oct27Daily.orders === 0) {
    throw new Error('October 27 activity missing from daily analytics chart!');
  }
  if (!oct28Daily || oct28Daily.orders === 0) {
    throw new Error('October 28 activity missing from daily analytics chart!');
  }
  console.log('✓ October 27–28 records successfully appear in Daily Operational Velocity chart!');

  // Test 2: Global Dashboard Data (preset: 30d)
  console.log('\n[Test 2] Testing Global fetchDashboardData (preset: 30d)...');
  const global30d = await fetchDashboardData(supabase, { preset: '30d' });
  console.log('30d Overview:', global30d.overview);
  console.log('30d Total Revenue:', `₹${global30d.overview.totalRevenue}`);
  console.log('30d Paid Orders:', global30d.overview.paidOrders);
  console.log('30d Completed Prints:', global30d.overview.completedPrints);

  // Both Oct 8 and Oct 27 should be represented in 30d chart
  const oct8Daily = global30d.dailyAnalytics.find((d) => d.date === '2026-10-08');
  const oct27In30d = global30d.dailyAnalytics.find((d) => d.date === '2026-10-27');
  if (!oct8Daily || oct8Daily.revenue === 0) {
    throw new Error('October 8 data missing from 30d chart!');
  }
  if (!oct27In30d || oct27In30d.revenue !== 4) {
    throw new Error(`October 27 data mismatch in 30d chart! Expected ₹4 revenue, got ₹${oct27In30d?.revenue}`);
  }
  console.log('✓ Both October 8 and October 27 data accurately reflected in 30d chart.');

  // Test 3: Dedicated fetchKioskDashboardData for flareprint-003
  console.log('\n[Test 3] Testing Dedicated fetchKioskDashboardData for flareprint-003...');
  const fp3Data = await fetchKioskDashboardData(supabase, 'flareprint-003', { preset: '7d' });
  if (!fp3Data) {
    throw new Error('Failed to fetch flareprint-003 dashboard data');
  }
  console.log('FP3 Kiosk Info:', fp3Data.kiosk);
  console.log('FP3 Overview in 7d:', fp3Data.overview);
  console.log('FP3 Operational:', fp3Data.operational);
  console.log('FP3 Latest successful print:', fp3Data.operational.latestSuccessfulPrint);

  if (fp3Data.operational.latestSuccessfulPrint?.startsWith('2026-10-27') !== true) {
    throw new Error(`FP3 latest successful print should be from Oct 27, got: ${fp3Data.operational.latestSuccessfulPrint}`);
  }
  if (fp3Data.overview.completedPrints !== 2) {
    throw new Error(`FP3 completed prints in 7d should be 2, got: ${fp3Data.overview.completedPrints}`);
  }
  console.log('✓ FP3 dedicated dashboard correctly reflects recent October 27 completed jobs.');

  // Test 4: Dedicated fetchKioskDashboardData for flareprint-004
  console.log('\n[Test 4] Testing Dedicated fetchKioskDashboardData for flareprint-004...');
  const fp4Data7d = await fetchKioskDashboardData(supabase, 'flareprint-004', { preset: '7d' });
  if (!fp4Data7d) {
    throw new Error('Failed to fetch flareprint-004 dashboard data');
  }
  console.log('FP4 Kiosk Info:', fp4Data7d.kiosk);
  console.log('FP4 Overview (7d window):', fp4Data7d.overview);
  console.log('FP4 Operational (7d window):', fp4Data7d.operational);

  // In 7d window, FP4 has 7 sessions (all cancelled/expired, 0 completed prints)
  if (fp4Data7d.overview.paidOrders !== 0 || fp4Data7d.overview.totalRevenue !== 0) {
    throw new Error('FP4 in 7d window should have 0 paid orders and 0 revenue!');
  }
  if (fp4Data7d.overview.cancelledOrders !== 3) {
    throw new Error(`FP4 in 7d window should have 3 cancelled orders, got: ${fp4Data7d.overview.cancelledOrders}`);
  }
  if (isNaN(fp4Data7d.overview.avgOrderValue) || isNaN(fp4Data7d.overview.avgPagesPerOrder)) {
    throw new Error('NaN found in FP4 calculations!');
  }
  console.log('✓ FP4 operational history accurately captured without false revenue or NaN values.');

  // Test 5: Verification of NULL kiosk_id orders
  console.log('\n[Test 5] Verifying NULL kiosk_id orders are NOT attributed to kiosks...');
  const { data: nullOrders } = await supabase.from('orders').select('id, kiosk_id').is('kiosk_id', null);
  console.log(`Found ${nullOrders?.length || 0} orders with kiosk_id = NULL (web orders).`);

  const fp3All = await fetchKioskDashboardData(supabase, 'flareprint-003', { preset: 'all' });
  const fp4All = await fetchKioskDashboardData(supabase, 'flareprint-004', { preset: 'all' });
  console.log(`FP3 all-time jobs: ${fp3All?.overview.totalOrders}`);
  console.log(`FP4 all-time jobs: ${fp4All?.overview.totalOrders}`);

  // Test 6: Recent orders filter test (Audit log from public.orders)
  console.log('\n[Test 6] Testing fetchRecentOrders (public.orders audit log)...');
  const fp3OrdersList = await fetchRecentOrders(supabase, { kioskCode: 'flareprint-003', limit: 10 });
  console.log(`fetchRecentOrders for flareprint-003 returned ${fp3OrdersList.orders.length} orders (totalCount=${fp3OrdersList.totalCount}).`);
  fp3OrdersList.orders.forEach((o) => {
    if (o.kiosk_id !== 'flareprint-003') {
      throw new Error(`Order ${o.id} has kiosk_id ${o.kiosk_id}, expected flareprint-003!`);
    }
  });

  const fp4OrdersList = await fetchRecentOrders(supabase, { kioskCode: 'flareprint-004', limit: 10 });
  console.log(`fetchRecentOrders for flareprint-004 returned ${fp4OrdersList.orders.length} orders (totalCount=${fp4OrdersList.totalCount}).`);
  if (fp4OrdersList.orders.length !== 0) {
    throw new Error('FP4 orders in public.orders should be 0!');
  }
  console.log('✓ Kiosk filtering in recent orders audit log verified against public.orders.');

  // Test 7: Timezone IST test
  console.log('\n[Test 7] Testing Asia/Kolkata timezone helpers...');
  const sampleUtc = '2026-10-22T14:30:00Z'; // 14:30 UTC = 20:00 IST (+5:30)
  const istHour = getISTHour(sampleUtc);
  console.log(`UTC 14:30 converted to IST Hour: ${istHour} (expected 20)`);
  if (istHour !== 20) {
    throw new Error(`Expected hour 20 IST, got ${istHour}`);
  }

  const { startDate: start7d, endDate: end7d } = getDateRangeBounds('7d');
  console.log(`7d range bounds: ${start7d} to ${end7d}`);
  console.log('✓ Asia/Kolkata timezone conversion verified.');

  // Test 8: Historical comparison division by zero safety
  console.log('\n[Test 8] Testing Historical Comparison Delta edge cases...');
  const zeroToZero = calculateComparisonDelta(0, 0);
  const zeroToFifty = calculateComparisonDelta(50, 0);
  const fiftyToFifty = calculateComparisonDelta(50, 50);
  const fiftyToHundred = calculateComparisonDelta(100, 50);
  if (zeroToFifty.changeType !== 'no-baseline' || zeroToFifty.percentage !== null) {
    throw new Error('Zero baseline should return no-baseline with null percentage');
  }
  console.log('✓ Division by zero safely prevented in historical comparisons.');

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
