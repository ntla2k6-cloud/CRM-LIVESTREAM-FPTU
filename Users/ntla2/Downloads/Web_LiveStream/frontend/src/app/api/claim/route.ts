import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier');
  if (!identifier) {
    return NextResponse.json({ error: 'Thiếu số điện thoại hoặc ID' }, { status: 400 });
  }

  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { username: identifier }
      ]
    }
  });

  if (!customer) {
    return NextResponse.json({ error: 'Không tìm thấy thông tin trúng thưởng cho tài khoản này.' }, { status: 404 });
  }

  const winner = await prisma.winner.findFirst({
    where: {
      customerId: customer.id,
      status: 'PENDING_INFO'
    },
    include: {
      gift: true,
      liveSession: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!winner) {
    const claimed = await prisma.winner.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['INFO_RECEIVED', 'CONFIRMED'] }
      },
      include: { shipment: true },
      orderBy: { createdAt: 'desc' }
    });

    if (claimed) {
      const trackingCode = claimed.shipment?.id;
      return NextResponse.json({ error: 'Bạn đã đăng ký nhận phần quà này rồi! Đang chuyển hướng...', claimed: true, trackingCode }, { status: 400 });
    }

    return NextResponse.json({ error: 'Không tìm thấy phần quà nào đang chờ xác nhận.' }, { status: 404 });
  }

  return NextResponse.json({
    id: winner.id,
    customerName: customer.name || customer.username,
    customerPhone: customer.phone || '',
    giftName: winner.gift.name,
    liveSessionName: winner.liveSession.title
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { winnerId, name, phone, address, email } = body;

    if (!winnerId || !name || !phone || !address) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' }, { status: 400 });
    }

    const winner = await prisma.winner.findUnique({
      where: { id: winnerId },
      include: { gift: true, customer: true, liveSession: true }
    });

    if (!winner) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin trúng thưởng' }, { status: 404 });
    }

    if (winner.status !== 'PENDING_INFO') {
      return NextResponse.json({ error: 'Phần quà này đã được đăng ký nhận' }, { status: 400 });
    }

    await prisma.winner.update({
      where: { id: winnerId },
      data: { status: 'INFO_RECEIVED' }
    });

    await prisma.customer.update({
      where: { id: winner.customerId },
      data: { 
        name, 
        phone: winner.customer.phone ? winner.customer.phone : phone,
        email: winner.customer.email ? winner.customer.email : email
      }
    });

    const shipmentId = 'DON-' + Date.now().toString().slice(-6);
    
    await prisma.shipment.create({
      data: {
        id: shipmentId,
        winnerId: winner.id,
        recipientName: name,
        phone,
        address,
        recipientEmail: email || null,
        giftName: winner.gift.name,
        liveSessionId: winner.liveSessionId,
        status: 'UNPACKED',
        currentLocation: 'Hệ thống ghi nhận',
      }
    });

    await prisma.shipmentHistory.create({
      data: {
        shipmentId,
        status: 'UNPACKED',
        location: 'Hệ thống ghi nhận thông tin',
        note: 'Khách hàng điền thông tin nhận quà từ Landing Page'
      }
    });

    return NextResponse.json({ success: true, trackingCode: shipmentId });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}