import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({ where: { email: session.user.email } });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        status: session.user.status,
      },
      staff: staff ? {
        id: staff.id,
        role: staff.role,
        status: staff.status
      } : null
    });
  } catch (error) {
    console.error('Error fetching /api/auth/me', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
