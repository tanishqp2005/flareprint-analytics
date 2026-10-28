import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSupabaseClient } from '@/lib/supabase/admin';
import { fetchKioskDashboardData } from '@/lib/services/analytics';
import { DateFilter, DateRangePreset } from '@/types/analytics';
import { verifyAdminSession } from '@/lib/auth/admin-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kiosk_code: string }> }
) {
  try {
    const authCheck = await verifyAdminSession(request);
    if (!authCheck.authenticated || !authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized admin access' },
        { status: 401 }
      );
    }

    const { kiosk_code } = await context.params;
    if (!kiosk_code) {
      return NextResponse.json(
        { error: 'Kiosk code parameter is required' },
        { status: 400 }
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
    const kioskData = await fetchKioskDashboardData(supabase, kiosk_code, dateFilter);

    if (!kioskData) {
      return NextResponse.json(
        { error: `Kiosk '${kiosk_code}' was not found in registered fleet` },
        { status: 404 }
      );
    }

    return NextResponse.json(kioskData);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error(`API /api/kiosks error:`, err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
