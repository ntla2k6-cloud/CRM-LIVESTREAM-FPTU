import { PrismaService } from '../prisma/prisma.service.js';
import { MinigameGateway } from './minigame.gateway.js';
export declare class MinigameService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: MinigameGateway);
    processIncomingComment(data: {
        liveSessionId: string;
        username: string;
        content: string;
        tiktokUserId: string;
    }): Promise<void>;
}
