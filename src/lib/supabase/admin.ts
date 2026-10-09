import { createClient } from '@supabase/supabase-js';

export async function getAnalyticsSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Server configuration error: NEXT_PUBLIC_SUPABASE_URL is missing.');
  }

  // Strict check: Analytics queries require service-role key to read across all users/kiosks
  // Never fall back to the anon key, and fail clearly if not configured
  if (!serviceRoleKey || serviceRoleKey.trim() === '') {
    throw new Error(
      'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for analytics access. Please configure it in .env.local.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
