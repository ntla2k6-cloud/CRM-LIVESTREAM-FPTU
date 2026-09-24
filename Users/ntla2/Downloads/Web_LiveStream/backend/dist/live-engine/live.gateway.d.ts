import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveEngineService } from './live-engine.service.js';
export declare class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly liveEngineService;
    server: Server;
    constructor(liveEngineService: LiveEngineService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinLiveSession(liveSessionId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleStartTiktok(payload: {
        liveSessionId: string;
        tiktokUsername: string;
    }): Promise<{
        event: string;
        data: {
            status: string;
            username: string;
            message?: undefined;
        };
    } | {
        event: string;
        data: {
            status: string;
            message: any;
            username?: undefined;
        };
    }>;
    handleStopTiktok(liveSessionId: string): {
        event: string;
        data: {
            status: string;
        };
    };
}
