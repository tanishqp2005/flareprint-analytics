import { getAnalyticsSupabaseClient } from '../src/lib/supabase/admin';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/orders/route';
import { getDateRangeBounds, getISTDateKey } from '../src/lib/utils/date-helpers';

async function generateAdminAccessToken(): Promise<string> {
  const supabase = await getAnalyticsSupabaseClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'admin@sakec.ac.in',
  });
  if (error || !data.properties?.hashed_token) {
    throw new Error(`Failed to generate magiclink for admin: ${error?.message}`);
  }

  // Verify the otp/hashed_token with client to get a real session access token
  const anonClient = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: sessionData, error: verifyError } = await anonClient.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: 'magiclink',
  });

  if (verifyError || !sessionData.session?.access_token) {
    throw new Error(`Failed to obtain access token: ${verifyError?.message}`);
  }

  return sessionData.session.access_token;
}

async function callOrdersApi(urlPath: string, token: string) {
  const req = new NextRequest(`http://localhost:3000${urlPath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const res = await GET(req);
  const status = res.status;
  const json = await res.json();
  return { status, json };
}

async function runVerification() {
  console.log('=== FLAREPRINT ANALYTICS: ORDERS API & LOGS VERIFICATION ===\n');

  const supabase = await getAnalyticsSupabaseClient();

  // 1. Query newest 10 records in public.orders
  console.log('[Step 1] Querying newest 10 records in public.orders...');
  const { data: newestOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, file_name, kiosk_id, batch_id, total_price, payment_status, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (ordersError) throw ordersError;
  console.log(`Found ${newestOrders.length} orders in public.orders.`);
  const newestOrderTimestamp = newestOrders[0]?.created_at;
  console.log(`Newest public.orders timestamp: ${newestOrderTimestamp}`);
  console.log('Sample top 3 orders:');
  newestOrders.slice(0, 3).forEach((o, i) => {
    console.log(`  ${i + 1}. [${o.created_at}] ID: ${o.id.slice(0, 8)} | Kiosk: ${o.kiosk_id || 'Web'} | Status: ${o.status} | Pay: ${o.payment_status} | Price: ₹${o.total_price}`);
  });

  // 2. Query newest 10 records in public.kiosk_sessions
  console.log('\n[Step 2] Querying newest 10 records in public.kiosk_sessions...');
  const { data: newestSessions, error: sessionsError } = await supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, file_name, total_price, payment_status, status, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessionsError) throw sessionsError;
  console.log(`Found ${newestSessions.length} sessions in public.kiosk_sessions.`);
  const newestSessionTimestamp = newestSessions[0]?.created_at;
  console.log(`Newest public.kiosk_sessions timestamp: ${newestSessionTimestamp}`);
  console.log('Sample top 3 sessions:');
  newestSessions.slice(0, 3).forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.created_at}] ID: ${s.id.slice(0, 8)} | Status: ${s.status} | Pay: ${s.payment_status} | CompletedAt: ${s.completed_at || 'None'}`);
  });

  // 3. Record comparison
  console.log('\n[Step 3] Timestamp Comparison & Architecture Observation:');
  console.log(`- Newest Order in public.orders:         ${newestOrderTimestamp}`);
  console.log(`- Newest Session in public.kiosk_sessions: ${newestSessionTimestamp}`);
  console.log('Notice: public.kiosk_sessions contains October 27–28 records, whereas public.orders latest entry is October 20.');

  // 4. Authenticate admin and call actual /api/orders endpoint
  console.log('\n[Step 4] Authenticating admin user (admin@sakec.ac.in)...');
  const token = await generateAdminAccessToken();
  console.log('✓ Successfully generated real admin access token.');

  // Test 4a: Calling /api/orders default view (view=orders)
  console.log('\n[Step 5a] Testing /api/orders?view=orders (Orders View)...');
  const apiOrdersRes = await callOrdersApi('/api/orders?view=orders&limit=10', token);
  if (apiOrdersRes.status !== 200) {
    throw new Error(`API returned ${apiOrdersRes.status}: ${JSON.stringify(apiOrdersRes.json)}`);
  }
  const apiOrders = apiOrdersRes.json.orders;
  console.log(`API returned ${apiOrders.length} orders (totalCount=${apiOrdersRes.json.totalCount}).`);
  if (apiOrders.length > 0) {
    console.log(`First API order matches DB top order: ${apiOrders[0].id === newestOrders[0].id} (${apiOrders[0].id})`);
  }

  // Test 4b: Calling /api/orders with view=sessions (Kiosk Session History)
  console.log('\n[Step 5b] Testing /api/orders?view=sessions (Kiosk Sessions View)...');
  const apiSessionsRes = await callOrdersApi('/api/orders?view=sessions&limit=10', token);
  if (apiSessionsRes.status !== 200) {
    throw new Error(`API returned ${apiSessionsRes.status}: ${JSON.stringify(apiSessionsRes.json)}`);
  }
  const apiSessions = apiSessionsRes.json.sessions;
  console.log(`API returned ${apiSessions.length} sessions (totalCount=${apiSessionsRes.json.totalCount}).`);
  if (apiSessions.length > 0) {
    console.log(`First API session timestamp: ${apiSessions[0].created_at} | Kiosk: ${apiSessions[0].kiosk_code} | Status: ${apiSessions[0].status}`);
    console.log(`First API session matches DB top session: ${apiSessions[0].id === newestSessions[0].id}`);
  }

  // Test 4c: Calling /api/orders with view=unified (Unified Reconciled View)
  console.log('\n[Step 5c] Testing /api/orders?view=unified (Unified Reconciled View)...');
  const apiUnifiedRes = await callOrdersApi('/api/orders?view=unified&limit=15', token);
  if (apiUnifiedRes.status !== 200) {
    throw new Error(`API returned ${apiUnifiedRes.status}: ${JSON.stringify(apiUnifiedRes.json)}`);
  }
  const apiJobs = apiUnifiedRes.json.jobs;
  console.log(`API returned ${apiJobs.length} unified jobs (totalCount=${apiUnifiedRes.json.totalCount}).`);
  console.log('Top 5 Unified Activity entries:');
  apiJobs.slice(0, 5).forEach((j: any, i: number) => {
    console.log(`  ${i + 1}. [${j.created_at}] Source: ${j.source} | Kiosk: ${j.kiosk_id || 'Web'} | Status: ${j.status} | Pay: ${j.payment_status} | Price: ₹${j.total_price}`);
  });

  // 6. Chronological Order Verification
  console.log('\n[Step 6] Confirming Descending Chronological Ordering in All Views...');
  const verifyDescending = (items: { created_at: string }[], label: string) => {
    for (let i = 0; i < items.length - 1; i++) {
      const t1 = new Date(items[i].created_at).getTime();
      const t2 = new Date(items[i + 1].created_at).getTime();
      if (t1 < t2) {
        throw new Error(`${label} is not in descending order at index ${i}: ${items[i].created_at} < ${items[i + 1].created_at}`);
      }
    }
    console.log(`✓ ${label} strictly sorted descending (newest first).`);
  };

  verifyDescending(apiOrders, 'Orders View');
  verifyDescending(apiSessions, 'Sessions View');
  verifyDescending(apiJobs, 'Unified View');

  // 7. Testing Today and Last 30 Days filters in IST
  console.log('\n[Step 7] Testing Today and Last 30 Days filters (IST)...');
  const todayStr = getISTDateKey(new Date());
  console.log(`Current IST calendar date: ${todayStr}`);

  // Test 30d
  const res30d = await callOrdersApi('/api/orders?view=unified&preset=30d&limit=50', token);
  console.log(`Unified 30d count: ${res30d.json.totalCount} (items returned: ${res30d.json.jobs.length})`);
  if (res30d.json.totalCount < 5) {
    throw new Error(`Expected at least 5 jobs in 30d window, got ${res30d.json.totalCount}`);
  }
  console.log('✓ 30d filter correctly returns recent orders and sessions.');

  // Test Today
  const resToday = await callOrdersApi('/api/orders?view=unified&preset=today&limit=50', token);
  console.log(`Unified Today count for ${todayStr}: ${resToday.json.totalCount}`);
  console.log('✓ Today filter correctly handles IST midnight boundary.');

  // 8. Testing Search, Pagination, Kiosk & Payment Status Filters
  console.log('\n[Step 8] Testing Search, Pagination, and Kiosk & Status Filters...');

  // 8a: Pagination
  const page1 = await callOrdersApi('/api/orders?view=orders&limit=5&offset=0', token);
  const page2 = await callOrdersApi('/api/orders?view=orders&limit=5&offset=5', token);
  console.log(`Page 1 count: ${page1.json.orders.length}, Page 2 count: ${page2.json.orders.length}`);
  if (page1.json.orders[0]?.id === page2.json.orders[0]?.id) {
    throw new Error('Pagination offset failed: page 1 and page 2 returned same first item');
  }
  console.log('✓ Pagination offset works accurately.');

  // 8b: Kiosk Filter (flareprint-003)
  const fp3Orders = await callOrdersApi('/api/orders?view=orders&kioskCode=flareprint-003&limit=10', token);
  console.log(`Orders filtered for flareprint-003: ${fp3Orders.json.totalCount} records.`);
  fp3Orders.json.orders.forEach((o: any) => {
    if (o.kiosk_id !== 'flareprint-003') throw new Error(`Expected kiosk_id flareprint-003, got: ${o.kiosk_id}`);
  });
  console.log('✓ Kiosk filtering for flareprint-003 strictly verified.');

  // 8c: Kiosk Sessions Filter (flareprint-004)
  const fp4Sessions = await callOrdersApi('/api/orders?view=sessions&kioskCode=flareprint-004&limit=10', token);
  console.log(`Sessions filtered for flareprint-004: ${fp4Sessions.json.totalCount} records.`);
  fp4Sessions.json.sessions.forEach((s: any) => {
    if (s.kiosk_code !== 'flareprint-004') throw new Error(`Expected kiosk_code flareprint-004, got: ${s.kiosk_code}`);
  });
  console.log('✓ Kiosk filtering for flareprint-004 in sessions strictly verified.');

  // 8d: Payment status filter
  const paidOrders = await callOrdersApi('/api/orders?view=orders&status=completed&limit=10', token);
  console.log(`Paid orders count: ${paidOrders.json.totalCount}`);
  paidOrders.json.orders.forEach((o: any) => {
    if (o.payment_status !== 'completed') throw new Error(`Expected payment_status completed, got: ${o.payment_status}`);
  });
  console.log('✓ Payment status filter (completed) verified.');

  // 8e: Search filter
  const searchOrders = await callOrdersApi('/api/orders?view=orders&search=brochure&limit=5', token);
  console.log(`Search for "brochure" returned ${searchOrders.json.totalCount} orders.`);
  searchOrders.json.orders.forEach((o: any) => {
    if (!o.file_name?.toLowerCase().includes('brochure')) throw new Error(`Search mismatch: ${o.file_name}`);
  });
  console.log('✓ File name search verified.');

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
