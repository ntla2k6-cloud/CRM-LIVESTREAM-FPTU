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
    disconnectTiktok(body: {
        liveSessionId: string;
    }): Promise<void>;
    getStatus(liveSessionId: string): Promise<{
        status: "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
    }>;
}
