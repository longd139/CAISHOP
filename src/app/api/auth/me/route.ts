import { NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.sub,
        name: user.name,
        phone: user.phone || null,
        email: user.email || null,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
