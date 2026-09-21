import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  create(createLeadDto: any) {
    const { tiktokAccount, phone, fullName, highSchool, location, classGrade, campaignId, ...leadData } = createLeadDto;
    
    // Create a unique identifier for where clause if phone isn't provided
    const phoneIdentifier = phone || `unknown-${Date.now()}`;
    
    return this.prisma.lead.create({ 
      data: {
        ...leadData,
        customer: {
          connectOrCreate: {
            where: { phone: phoneIdentifier },
            create: { 
              tiktokAccount: tiktokAccount || '', 
              phone: phoneIdentifier,
              fullName: fullName || 'Khách hàng',
              highSchool: highSchool || '',
              location: location || '',
              classGrade: classGrade || ''
            }
          }
        },
        campaign: {
          connectOrCreate: {
            where: { id: campaignId || 'default-campaign' },
            create: { id: campaignId || 'default-campaign', name: 'Default Campaign' }
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
