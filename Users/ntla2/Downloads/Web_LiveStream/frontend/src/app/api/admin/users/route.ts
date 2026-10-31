import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isStaff, isManager } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const me = await getSessionUser(req);
  if (!isStaff(me?.role)) return NextResponse.json({ error: 'Chưa đăng nhập hoặc chưa được duyệt' }, { status: 401 });
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
    // Chỉ ADMIN/MANAGER được duyệt/đổi vai trò; chỉ ADMIN được cấp hoặc sửa quyền ADMIN/MANAGER
    const me = await getSessionUser(req);
    if (!isManager(me?.role)) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    const { userId, role, phone, department } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!target) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    if (me!.role !== 'ADMIN' && (isManager(target.role) || isManager(role))) {
      return NextResponse.json({ error: 'Chỉ Admin được cấp/sửa quyền Admin hoặc Manager' }, { status: 403 });
    }

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
