import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // We cannot easily use getServerSession here if we don't import the authOptions.
    // Wait, the authOptions are exported from oute.ts. Let's just check the session token cookie.
    
    // Instead of parsing the session manually, let's just let the client pass their email or use getServerSession.
    // Wait, let's just find the user by their session token directly from the database!
    
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
