import { getAnalyticsSupabaseClient } from '../src/lib/supabase/admin';

async function main() {
  const supabase = await getAnalyticsSupabaseClient();
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('listUsers error:', error);
  } else {
    console.log('Found', users.length, 'users:');
    users.forEach(u => console.log('-', u.email, 'id:', u.id));
  }
}

main().catch(console.error);
