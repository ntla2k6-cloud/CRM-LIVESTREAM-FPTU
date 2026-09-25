import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: any) {
    const { tiktokAccount, phone, fullName, highSchool, location, classGrade, campaignId, note, ...leadData } = createLeadDto;
    
    let customer = null;
    if (phone) {
      customer = await this.prisma.customer.findFirst({ where: { phone } });
    } else if (tiktokAccount) {
      customer = await this.prisma.customer.findFirst({ where: { tiktokAccount } });
    }

    if (!customer) {
      // Prisma throws error if multiple unique fields are "" so we use undefined or null
      customer = await this.prisma.customer.create({
        data: {
          tiktokAccount: tiktokAccount || null,
          phone: phone || null,
          fullName: fullName || 'Khách hàng',
          highSchool: highSchool || '',
          location: location || '',
          classGrade: classGrade || ''
        }
      });
    }

    const campId = campaignId || 'default-campaign';
    let campaign = await this.prisma.campaign.findUnique({ where: { id: campId } });
    if (!campaign) {
      campaign = await this.prisma.campaign.create({
        data: { id: campId, name: 'Default Campaign' }
      });
    }

    const lead = await this.prisma.lead.create({
      data: {
        ...leadData,
        customerId: customer.id,
        campaignId: campaign.id
      }
    });

    if (note) {
      await this.prisma.leadHistory.create({
        data: {
          leadId: lead.id,
          action: 'NOTE',
          note: note
        }
      });
    }

    return lead;
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
