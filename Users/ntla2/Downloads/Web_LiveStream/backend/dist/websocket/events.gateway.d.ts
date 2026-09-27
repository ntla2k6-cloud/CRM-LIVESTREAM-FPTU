import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinSession(sessionId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleLeaveSession(sessionId: string, client: Socket): {
        event: string;
        data: string;
    };
}
