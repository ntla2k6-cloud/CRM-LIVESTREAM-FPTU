import { LiveSessionService } from './live-session.service.js';
export declare class LiveSessionController {
    private readonly liveSessionService;
    constructor(liveSessionService: LiveSessionService);
    create(createLiveSessionDto: any): Promise<{
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
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        questions: {
            id: string;
            content: string | null;
            liveSessionId: string;
            code: string;
            correctAnswer: string;
            timeLimit: number;
            status: string;
            startedAt: Date | null;
            closedAt: Date | null;
        }[];
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
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__LiveSessionClient<({
        leads: {
            id: string;
            liveSessionId: string | null;
            customerId: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            campaignId: string | null;
            assignedCskhId: string | null;
            source: string;
            leadScore: number;
            intent: string | null;
        }[];
        comments: {
            id: string;
            tiktokUserId: string | null;
            username: string;
            content: string;
            aiIntent: string | null;
            serverTimestamp: Date;
            liveSessionId: string;
            customerId: string | null;
        }[];
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateLiveSessionDto: any): import(".prisma/client").Prisma.Prisma__LiveSessionClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__LiveSessionClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
