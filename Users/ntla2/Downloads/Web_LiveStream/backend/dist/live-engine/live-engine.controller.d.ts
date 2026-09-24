import { LiveEngineService } from './live-engine.service.js';
export declare class LiveEngineController {
    private readonly liveEngineService;
    constructor(liveEngineService: LiveEngineService);
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
    }): Promise<{
        id: string;
        tiktokUserId: string | null;
        username: string;
        content: string;
        aiIntent: string | null;
        serverTimestamp: Date;
        liveSessionId: string;
        customerId: string | null;
    }>;
}
