import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
const DEFAULT_ADMIN_EMAILS = [
  'admin@sakec.ac.in',
  'store@sakec.ac.in',
  'tanishq.18055@sakec.ac.in',
  'tanishq.18052@sakec.ac.in',
];

export function isAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const envAdmins = process.env.ADMIN_EMAILS;
  const parsed = envAdmins
    ? envAdmins.split(',').map((e) => e.trim().toLowerCase())
    : [];
  const allowed = new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...parsed]);
  return allowed.has(email.trim().toLowerCase());
}

export async function verifyAdminSession(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Check Authorization Bearer header if provided
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await client.auth.getUser(token);
        if (user && !error) {
          const authorized = isAuthorizedAdmin(user.email);
          return {
            authenticated: true,
            authorized,
            user,
            error: authorized ? null : 'User is not authorized as an administrator',
          };
        }
      }
    }
  }

  // 2. Check cookies session
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (!error && session && session.user) {
      const isAuthorized = isAuthorizedAdmin(session.user.email);
      return {
        authenticated: true,
        authorized: isAuthorized,
        user: session.user,
        error: isAuthorized ? null : 'User is not authorized as an administrator',
      };
    }
  } catch (err) {
    // In build or pre-render, cookies() might not be available
  }

  return {
    authenticated: false,
    authorized: false,
    user: null,
    error: 'Not authenticated',
  };
}
