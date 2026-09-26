import { LeadService } from './lead.service.js';
export declare class LeadController {
    private readonly leadService;
    constructor(leadService: LeadService);
    create(createLeadDto: any): Promise<{
        id: string;
        liveSessionId: string | null;
        customerId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        source: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            tiktokAccount: string | null;
            fullName: string | null;
            phone: string | null;
            highSchool: string | null;
            classGrade: string | null;
            location: string | null;
            interestedMajor: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        liveSessionId: string | null;
        customerId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        source: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__LeadClient<({
        customer: {
            id: string;
            tiktokAccount: string | null;
            fullName: string | null;
            phone: string | null;
            highSchool: string | null;
            classGrade: string | null;
            location: string | null;
            interestedMajor: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        liveSessionId: string | null;
        customerId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        source: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateLeadDto: any): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: string;
        liveSessionId: string | null;
        customerId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        source: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: string;
        liveSessionId: string | null;
        customerId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string | null;
        source: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
