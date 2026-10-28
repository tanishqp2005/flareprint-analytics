import { getAnalyticsSupabaseClient } from '../src/lib/supabase/admin';

async function main() {
  const supabase = await getAnalyticsSupabaseClient();
  const { data: orders, error: oErr } = await supabase
    .from('orders')
    .select('id, file_name, kiosk_id, batch_id, total_price, payment_status, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (oErr) console.error('Orders query error:', oErr);
  console.log('--- NEWEST 10 ORDERS in public.orders ---');
  console.log(JSON.stringify(orders, null, 2));
  if (orders && orders.length > 0) {
    console.log('Newest Order Timestamp:', orders[0].created_at);
  }

  const { data: sessions, error: sErr } = await supabase
    .from('kiosk_sessions')
    .select('id, kiosk_id, status, payment_status, total_price, page_count, created_at, expires_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sErr) console.error('Sessions query error:', sErr);
  console.log('--- NEWEST 10 SESSIONS in public.kiosk_sessions ---');
  console.log(JSON.stringify(sessions, null, 2));
  if (sessions && sessions.length > 0) {
    console.log('Newest Session Timestamp:', sessions[0].created_at);
  }
}

main().catch(console.error);
