import { PrismaService } from '../prisma/prisma.service.js';
export declare class LeadService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createLeadDto: any): Promise<{
        id: string;
        status: string;
        source: string;
        leadScore: number;
        intent: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        campaignId: string | null;
        liveSessionId: string | null;
        assignedCskhId: string | null;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fullName: string | null;
            phone: string | null;
            tiktokAccount: string | null;
            highSchool: string | null;
            classGrade: string | null;
            location: string | null;
            interestedMajor: string | null;
        };
    } & {
        id: string;
        status: string;
        source: string;
        leadScore: number;
        intent: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        campaignId: string | null;
        liveSessionId: string | null;
        assignedCskhId: string | null;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__LeadClient<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fullName: string | null;
            phone: string | null;
            tiktokAccount: string | null;
            highSchool: string | null;
            classGrade: string | null;
            location: string | null;
            interestedMajor: string | null;
        };
    } & {
        id: string;
        status: string;
        source: string;
        leadScore: number;
        intent: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        campaignId: string | null;
        liveSessionId: string | null;
        assignedCskhId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateLeadDto: any): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: string;
        status: string;
        source: string;
        leadScore: number;
        intent: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        campaignId: string | null;
        liveSessionId: string | null;
        assignedCskhId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: string;
        status: string;
        source: string;
        leadScore: number;
        intent: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        campaignId: string | null;
        liveSessionId: string | null;
        assignedCskhId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
