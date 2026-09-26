import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const { email, name, phone, image } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

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
