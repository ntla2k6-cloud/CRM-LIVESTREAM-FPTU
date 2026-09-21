import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Lấy toàn bộ user đã đăng nhập (nhân sự)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH: Cập nhật role + thông tin bổ sung
export async function PATCH(req: NextRequest) {
  try {
    const { userId, role, phone, department } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
      }
    });

    // --- ĐỒNG BỘ SANG BẢNG STAFF (XẾP LỊCH) ---
    if (updated.email) {
      const staffRoleMap: Record<string, string> = {
        'VJ_HOST': 'VJ',
        'BIEN_TAP': 'Biên tập',
        'SAN_XUAT': 'Producer',
        'KY_THUAT': 'Kỹ thuật',
        'CSKH': 'CSKH',
        'THU_KHO': 'Thủ kho',
        'ADMIN': 'Admin',
        'MANAGER': 'Manager'
      };
      const mappedRole = staffRoleMap[updated.role] || updated.role;
      
      const existingStaff = await prisma.staff.findFirst({ where: { email: updated.email } });
      if (existingStaff) {
        await prisma.staff.update({
          where: { id: existingStaff.id },
          data: { role: mappedRole, phone: updated.phone || existingStaff.phone, name: updated.name || existingStaff.name }
        });
      } else if (updated.role !== 'GUEST') {
        await prisma.staff.create({
          data: {
            name: updated.name || 'Người dùng mới',
            email: updated.email,
            role: mappedRole,
            phone: updated.phone || null,
            rate: 150000,
            color: 'bg-blue-500',
            status: 'Sẵn sàng'
          }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
