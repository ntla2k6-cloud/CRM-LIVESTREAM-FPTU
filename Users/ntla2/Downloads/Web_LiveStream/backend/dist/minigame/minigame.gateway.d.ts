import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class MinigameGateway {
    private readonly prisma;
    server: Server;
    constructor(prisma: PrismaService);
    handleStartGame(data: {
        liveSessionId: string;
        questionCode: string;
        timeLimit: number;
    }, client: Socket): Promise<{
        status: string;
    }>;
    handleEndGame(data: {
        liveSessionId: string;
        questionCode: string;
    }, client: Socket): Promise<{
        status: string;
    }>;
    broadcastNewComment(comment: any): void;
    broadcastLeaderboardUpdate(leaderboard: any[]): void;
}
