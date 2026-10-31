import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function PATCH(req: NextRequest) {
  try {
    // Chỉ sửa hồ sơ của chính mình (email lấy từ phiên, không tin body)
    const me = await getSessionUser(req);
    if (!me?.email) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    const email = me.email;
    const { name, phone, image } = await req.json();

    const updated = await prisma.user.update({
      where: { email },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(image && { image }),
      }
    });
    
    // Sync to staff if exists
    const existingStaff = await prisma.staff.findFirst({ where: { email } });
    if (existingStaff) {
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: { 
          name: updated.name || existingStaff.name,
          phone: updated.phone || existingStaff.phone,
          avatar: updated.image || existingStaff.avatar
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
