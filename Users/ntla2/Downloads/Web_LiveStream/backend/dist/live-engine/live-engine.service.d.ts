import { PrismaService } from '../prisma/prisma.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
export declare class LiveEngineService {
    private readonly prisma;
    private readonly pipeline;
    private readonly eventsGateway;
    private readonly logger;
    private sources;
    constructor(prisma: PrismaService, pipeline: PipelineService, eventsGateway: EventsGateway);
    processWinner(liveSessionId: string, questionId: string, customerId: string, giftId: number): Promise<{
        id: string;
        liveSessionId: string;
        customerId: string;
        status: string;
        createdAt: Date;
        questionId: string | null;
        giftId: number;
    }>;
    connectToTiktok(liveSessionId: string, tiktokUsername: string): Promise<"DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR">;
    disconnectFromTiktok(liveSessionId: string): void;
    getTiktokStatus(liveSessionId: string): any;
    resolveLiveSession(input: string): Promise<{
        description: string | null;
        id: string;
        platform: string | null;
        likeCount: number;
        status: string;
        createdAt: Date;
        color: string | null;
        platformLiveId: string | null;
        liveUrl: string | null;
        creatorUsername: string | null;
        creatorDisplayName: string | null;
        creatorAvatar: string | null;
        viewerCount: number;
        shareCount: number;
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
    getAnalytics(liveSessionId: string): Promise<{
        totalComments: number;
        uniqueUsers: number;
        totalLeads: number;
        hotLeads: number;
        topKeywords: {
            keyword: string;
            count: number;
        }[];
        topCommenters: {
            username: string;
            avatar: string | null;
            count: number;
        }[];
        topComments: {
            id: string;
            platform: string;
            platformCommentId: string;
            platformUserId: string | null;
            username: string;
            displayName: string | null;
            avatar: string | null;
            content: string;
            likeCount: number;
            replyCount: number;
            parentCommentId: string | null;
            category: string;
            isProcessed: boolean;
            processingStatus: string;
            priority: number;
            rawPayload: string | null;
            aiIntent: string | null;
            serverTimestamp: Date;
            updatedAt: Date;
            liveSessionId: string;
            customerId: string | null;
        }[];
    }>;
}
