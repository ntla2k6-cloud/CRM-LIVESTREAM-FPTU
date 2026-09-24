import { PrismaService } from '../prisma/prisma.service.js';
export declare class LiveEngineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    processWinner(liveSessionId: string, questionId: string, customerId: string, giftId: number): Promise<{
        id: string;
        liveSessionId: string;
        customerId: string;
        status: string;
        createdAt: Date;
        questionId: string | null;
        giftId: number;
    }>;
    processComment(liveSessionId: string, tiktokUsername: string, comment: string): Promise<{
        id: string;
        tiktokUserId: string | null;
        username: string;
        content: string;
        aiIntent: string | null;
        serverTimestamp: Date;
        liveSessionId: string;
        customerId: string | null;
    }>;
    private activeConnections;
    connectToTiktok(liveSessionId: string, tiktokUsername: string, server: any): Promise<void>;
    disconnectFromTiktok(liveSessionId: string): void;
}
