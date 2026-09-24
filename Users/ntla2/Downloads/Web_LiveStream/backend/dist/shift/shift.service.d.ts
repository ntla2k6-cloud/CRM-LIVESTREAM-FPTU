import { PrismaService } from '../prisma/prisma.service.js';
export declare class ShiftService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        color: string | null;
        liveId: string | null;
        title: string;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        title: string;
        day: number | null;
        time: string | null;
        type: string | null;
        project: string | null;
        color: string | null;
        status: string;
        assignments: {
            id: number;
            liveSessionId: string;
            bonus: number;
            rateOverride: number | null;
            staffId: number;
        }[];
        registered: any;
    }[]>;
    findOne(id: string): Promise<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        color: string | null;
        liveId: string | null;
        title: string;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string | null;
    } | null>;
    update(id: string, data: any): Promise<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        color: string | null;
        liveId: string | null;
        title: string;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string | null;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        status: string;
        createdAt: Date;
        color: string | null;
        liveId: string | null;
        title: string;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string | null;
    }>;
    assignStaff(shiftId: string, data: any): Promise<{
        id: number;
        liveSessionId: string;
        bonus: number;
        rateOverride: number | null;
        staffId: number;
    }>;
}
