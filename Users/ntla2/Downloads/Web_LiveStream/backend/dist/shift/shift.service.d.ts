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
        assignments: ({
            staff: {
                id: number;
                name: string;
                status: string;
                phone: string | null;
                role: string;
                email: string | null;
                rate: number;
                avatar: string | null;
                color: string | null;
                joinDate: string | null;
            };
        } & {
            id: number;
            liveSessionId: string;
            bonus: number;
            rateOverride: number | null;
            staffId: number;
        })[];
        registered: any;
    }[]>;
    findOne(id: string): Promise<({
        assignments: ({
            staff: {
                id: number;
                name: string;
                status: string;
                phone: string | null;
                role: string;
                email: string | null;
                rate: number;
                avatar: string | null;
                color: string | null;
                joinDate: string | null;
            };
        } & {
            id: number;
            liveSessionId: string;
            bonus: number;
            rateOverride: number | null;
            staffId: number;
        })[];
    } & {
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
    }) | null>;
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
    removeAssignment(assignmentId: string): Promise<{
        id: number;
        liveSessionId: string;
        bonus: number;
        rateOverride: number | null;
        staffId: number;
    }>;
    assignStaff(shiftId: string, data: any): Promise<{
        id: number;
        liveSessionId: string;
        bonus: number;
        rateOverride: number | null;
        staffId: number;
    }>;
}
