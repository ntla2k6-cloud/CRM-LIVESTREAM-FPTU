"use server"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateUserRole(userId: string, newRole: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });
}
