import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  create(createLeadDto: any) {
    return this.prisma.lead.create({ 
      data: {
        ...createLeadDto,
        customer: {
          connectOrCreate: {
            where: { tiktokAccount: createLeadDto.tiktokAccount || 'unknown' },
            create: { tiktokAccount: createLeadDto.tiktokAccount || 'unknown', phone: createLeadDto.phone }
          }
        },
        campaign: {
          connectOrCreate: {
            where: { id: 'default-campaign' },
            create: { id: 'default-campaign', name: 'Default Campaign' }
          }
        }
      } 
    });
  }

  findAll() {
    return this.prisma.lead.findMany({
      include: { customer: true }
    });
  }

  findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: { customer: true }
    });
  }

  update(id: string, updateLeadDto: any) {
    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  remove(id: string) {
    return this.prisma.lead.delete({ where: { id } });
  }
}
