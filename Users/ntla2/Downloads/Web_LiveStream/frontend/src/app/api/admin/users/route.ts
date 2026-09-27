import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
        phone: true,
        department: true,
        createdAt: true,
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role, phone, department } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Cập nhật User
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
        ...(role && role !== 'GUEST' ? { status: 'ACTIVE' } : {})
      }
    });

    // Đồng bộ sang Staff
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
          data: { 
            role: mappedRole, 
            phone: updated.phone || existingStaff.phone, 
            name: updated.name || existingStaff.name,
            status: updated.role !== 'GUEST' ? 'Sẵn sàng' : 'PENDING'
          }
        });
      } else {
        await prisma.staff.create({
          data: {
            name: updated.name || 'Người dùng mới',
            email: updated.email,
            role: mappedRole,
            phone: updated.phone || null,
            rate: 150000,
            color: 'bg-blue-500',
            status: updated.role !== 'GUEST' ? 'Sẵn sàng' : 'PENDING'
          }
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
