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
        liveSessionId: string;
        customerId: string;
        status: string;
        createdAt: Date;
        questionId: string | null;
        giftId: number;
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
    disconnectTiktok(body: {
        liveSessionId: string;
    }): Promise<void>;
    getStatus(liveSessionId: string): Promise<{
        status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
    }>;
}
