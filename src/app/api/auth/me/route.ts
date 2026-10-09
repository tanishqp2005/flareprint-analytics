import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminSession(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { authenticated: false, authorized: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      authorized: auth.authorized,
      user: {
        id: auth.user.id,
        email: auth.user.email,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Auth check error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
