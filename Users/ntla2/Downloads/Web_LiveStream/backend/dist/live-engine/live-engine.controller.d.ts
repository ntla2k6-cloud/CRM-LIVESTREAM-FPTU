import { LiveEngineService } from './live-engine.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';
export declare class LiveEngineController {
    private readonly liveEngineService;
    private readonly pipelineService;
    constructor(liveEngineService: LiveEngineService, pipelineService: PipelineService);
    declareWinner(body: {
        liveSessionId: string;
        questionId: string;
        customerId: string;
        giftId: number;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        liveSessionId: string;
        questionId: string | null;
        customerId: string;
        giftId: number;
    }>;
    handleExtensionComments(body: {
        liveSessionId: string;
        comments: Array<{
            platformCommentId: string;
            username: string;
            content: string;
            timestamp: number;
        }>;
    }): Promise<{
        success: boolean;
        processed: number;
    }>;
    handleIncomingComment(body: {
        liveSessionId: string;
        tiktokUsername: string;
        comment: string;
    }): Promise<void>;
    connectTiktok(body: {
        liveSessionId: string;
        tiktokUsername: string;
    }): Promise<"DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR">;
    resolveLiveSession(body: {
        input: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        platformLiveId: string | null;
        liveId: string | null;
        campaignId: string | null;
        platform: string | null;
        liveUrl: string | null;
        creatorUsername: string | null;
        creatorDisplayName: string | null;
        creatorAvatar: string | null;
        viewerCount: number;
        likeCount: number;
        shareCount: number;
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
    }>;
    disconnectTiktok(body: {
        liveSessionId: string;
    }): Promise<void>;
    getStatus(liveSessionId: string): Promise<{
        status: any;
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
            likeCount: number;
            username: string;
            platformCommentId: string;
            platformUserId: string | null;
            displayName: string | null;
            avatar: string | null;
            content: string;
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
