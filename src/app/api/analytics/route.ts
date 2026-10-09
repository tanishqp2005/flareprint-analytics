import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSupabaseClient } from '@/lib/supabase/admin';
import { fetchDashboardData } from '@/lib/services/analytics';
import { DateFilter, DateRangePreset } from '@/types/analytics';
import { verifyAdminSession } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authCheck = await verifyAdminSession(request);
    if (!authCheck.authenticated || !authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const preset = (searchParams.get('preset') || '30d') as DateRangePreset;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const dateFilter: DateFilter = {
      preset,
      startDate,
      endDate,
    };

    const supabase = await getAnalyticsSupabaseClient();
    const dashboardData = await fetchDashboardData(supabase, dateFilter);

    return NextResponse.json(dashboardData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('API /api/analytics error:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
