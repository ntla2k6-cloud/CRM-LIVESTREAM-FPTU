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
        createdAt: Date;
        status: string;
        questionId: string | null;
        giftId: number;
    }>;
    connectToTiktok(liveSessionId: string, tiktokUsername: string): Promise<"DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR">;
    disconnectFromTiktok(liveSessionId: string): void;
    getTiktokStatus(liveSessionId: string): any;
    resolveLiveSession(input: string): Promise<{
        id: string;
        platform: string | null;
        likeCount: number;
        createdAt: Date;
        description: string | null;
        status: string;
        platformLiveId: string | null;
        liveId: string | null;
        campaignId: string | null;
        liveUrl: string | null;
        creatorUsername: string | null;
        creatorDisplayName: string | null;
        creatorAvatar: string | null;
        viewerCount: number;
        shareCount: number;
        title: string;
        color: string | null;
        project: string | null;
        day: number | null;
        time: string | null;
        registered: string | null;
        scheduledAt: Date | null;
        startTime: Date | null;
        endTime: Date | null;
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
            liveSessionId: string;
            customerId: string | null;
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
        }[];
    }>;
}
