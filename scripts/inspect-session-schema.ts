import { getAnalyticsSupabaseClient } from '../src/lib/supabase/admin';

async function main() {
  const supabase = await getAnalyticsSupabaseClient();
  const { data, error } = await supabase.from('kiosk_sessions').select('*').limit(1);
  if (error) console.error('Error:', error);
  if (data && data[0]) {
    console.log('kiosk_sessions columns:', Object.keys(data[0]));
    console.log('sample session:', data[0]);
  }
}

main().catch(console.error);
