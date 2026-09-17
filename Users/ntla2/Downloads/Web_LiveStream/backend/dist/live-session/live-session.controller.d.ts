import { LiveSessionService } from './live-session.service.js';
export declare class LiveSessionController {
    private readonly liveSessionService;
    constructor(liveSessionService: LiveSessionService);
    create(createLiveSessionDto: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        liveId: string | null;
        title: string;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string;
    }>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        questions: {
            id: string;
            content: string | null;
            liveSessionId: string;
            code: string;
            correctAnswer: string;
            status: string;
            startedAt: Date | null;
            closedAt: Date | null;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        liveId: string | null;
        title: string;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string;
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__LiveSessionClient<({
        leads: {
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
        }[];
        comments: {
            id: string;
            tiktokUserId: string | null;
            username: string;
            content: string;
            aiIntent: string | null;
            timestamp: Date;
            liveSessionId: string;
            customerId: string | null;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        liveId: string | null;
        title: string;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateLiveSessionDto: any): import(".prisma/client").Prisma.Prisma__LiveSessionClient<{
        id: string;
        status: string;
        createdAt: Date;
        liveId: string | null;
        title: string;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__LiveSessionClient<{
        id: string;
        status: string;
        createdAt: Date;
        liveId: string | null;
        title: string;
        startTime: Date | null;
        endTime: Date | null;
        campaignId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
