import { PrismaService } from '../prisma/prisma.service.js';
export declare class LeadService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createLeadDto: any): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: string;
        liveSessionId: string | null;
        customerId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        campaignId: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
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
        campaignId: string;
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
        campaignId: string;
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
        campaignId: string;
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
        campaignId: string;
        leadScore: number;
        intent: string | null;
        assignedCskhId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
