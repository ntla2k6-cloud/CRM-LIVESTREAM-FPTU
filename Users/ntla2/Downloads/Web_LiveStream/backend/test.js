import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); await prisma.shipment.findMany().then(r => console.log(JSON.stringify(r))).finally(() => prisma.$disconnect());
