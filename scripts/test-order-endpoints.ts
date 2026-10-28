import { getAnalyticsSupabaseClient } from '../src/lib/supabase/admin';
import { getDateRangeBounds, getISTDateKey } from '../src/lib/utils/date-helpers';
import { fetchRecentOrders } from '../src/lib/services/analytics';

async function main() {
  console.log('Now ISO:', new Date().toISOString());
  console.log('IST todayStr:', getISTDateKey(new Date()));
  console.log('Today bounds:', getDateRangeBounds('today'));
  console.log('Yesterday bounds:', getDateRangeBounds('yesterday'));
  console.log('7d bounds:', getDateRangeBounds('7d'));
  console.log('30d bounds:', getDateRangeBounds('30d'));

  const supabase = await getAnalyticsSupabaseClient();

  // Test fetchRecentOrders with 30d
  const res30d = await fetchRecentOrders(supabase, { dateFilter: { preset: '30d' } });
  console.log('fetchRecentOrders 30d count:', res30d.totalCount, 'orders returned:', res30d.orders.length);
  if (res30d.orders.length > 0) {
    console.log('Sample 30d order:', res30d.orders[0]);
  }

  // Test fetchRecentOrders with all
  const resAll = await fetchRecentOrders(supabase, { dateFilter: { preset: 'all' } });
  console.log('fetchRecentOrders all count:', resAll.totalCount, 'orders returned:', resAll.orders.length);

  // Test fetchRecentOrders with today
  const resToday = await fetchRecentOrders(supabase, { dateFilter: { preset: 'today' } });
  console.log('fetchRecentOrders today count:', resToday.totalCount);
}

main().catch(console.error);
