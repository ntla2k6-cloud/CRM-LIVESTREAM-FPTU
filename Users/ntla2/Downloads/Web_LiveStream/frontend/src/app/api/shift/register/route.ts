import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 });
    }

    const staff = await prisma.staff.findFirst({ where: { email: session.user.email } });
    if (!staff) {
      return NextResponse.json({ error: 'Tài khoản chưa được liên kết với nhân sự' }, { status: 403 });
    }
    
    if (staff.status !== 'Sẵn sàng') {
       return NextResponse.json({ error: 'Tài khoản của bạn chưa được duyệt hoặc đang bị khóa' }, { status: 403 });
    }

    const { shiftId, action } = await req.json();
    
    if (!shiftId || !action) {
      return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });
    }

    const shift = await prisma.liveSession.findUnique({
      where: { id: String(shiftId) }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Ca trực không tồn tại' }, { status: 404 });
    }

    let currentRegistered: string[] = [];
    if (shift.registered) {
      try {
        currentRegistered = JSON.parse(shift.registered);
      } catch (e) {
        currentRegistered = [];
      }
    }
    
    const stringStaffId = String(staff.id);
    let newRegistered = [...currentRegistered];

    if (action === 'register') {
      if (!currentRegistered.includes(stringStaffId)) {
        newRegistered.push(stringStaffId);
      } else {
        return NextResponse.json({ error: 'Bạn đã đăng ký ca trực này rồi' }, { status: 409 });
      }
    } else if (action === 'cancel') {
      newRegistered = currentRegistered.filter(id => id !== stringStaffId);
    } else {
      return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
    }

    await prisma.liveSession.update({
      where: { id: String(shiftId) },
      data: { registered: JSON.stringify(newRegistered) }
    });

    return NextResponse.json({ success: true, registered: newRegistered });
  } catch (error) {
    console.error('Error in shift register API', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}