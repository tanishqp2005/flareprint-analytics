import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSupabaseClient } from '@/lib/supabase/admin';
import { fetchRecentOrders } from '@/lib/services/analytics';
import { DateRangePreset } from '@/types/analytics';
import { verifyAdminSession } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminSession(request);
    if (!authCheck.authenticated || !authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const kioskCode = searchParams.get('kioskCode') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const preset = searchParams.get('preset') as DateRangePreset | null;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const dateFilter = preset ? { preset, startDate, endDate } : undefined;

    const supabase = await getAnalyticsSupabaseClient();
    const result = await fetchRecentOrders(supabase, {
      limit,
      offset,
      kioskCode,
      status,
      search,
      dateFilter,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('API /api/orders error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
