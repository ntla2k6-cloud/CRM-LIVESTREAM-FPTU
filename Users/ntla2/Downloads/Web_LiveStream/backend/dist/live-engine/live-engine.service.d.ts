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
    getTiktokStatus(liveSessionId: string): "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";
}
