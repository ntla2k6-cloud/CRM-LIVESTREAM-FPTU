import { PrismaService } from '../prisma/prisma.service.js';
export declare class ShiftService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        id: string;
        liveId: string | null;
        title: string;
        description: string | null;
        color: string | null;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        createdAt: Date;
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
            bonus: number;
            rateOverride: number | null;
            staffId: number;
            liveSessionId: string;
        }[];
        registered: any;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        liveId: string | null;
        title: string;
        description: string | null;
        color: string | null;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        createdAt: Date;
        campaignId: string | null;
    } | null>;
    update(id: string, data: any): Promise<{
        id: string;
        liveId: string | null;
        title: string;
        description: string | null;
        color: string | null;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        createdAt: Date;
        campaignId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        liveId: string | null;
        title: string;
        description: string | null;
        color: string | null;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
        status: string;
        createdAt: Date;
        campaignId: string | null;
    }>;
    removeAssignment(assignmentId: string): Promise<{
        id: number;
        bonus: number;
        rateOverride: number | null;
        staffId: number;
        liveSessionId: string;
    }>;
    assignStaff(shiftId: string, data: any): Promise<{
        id: number;
        bonus: number;
        rateOverride: number | null;
        staffId: number;
        liveSessionId: string;
    }>;
}
