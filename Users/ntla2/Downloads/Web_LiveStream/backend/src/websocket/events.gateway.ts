import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`[WebSocket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinSession')
  handleJoinSession(@MessageBody() sessionId: string, @ConnectedSocket() client: Socket) {
    client.join(sessionId);
    console.log(`[WebSocket] Client ${client.id} joined session ${sessionId}`);
    return { event: 'joined', data: sessionId };
  }

  @SubscribeMessage('leaveSession')
  handleLeaveSession(@MessageBody() sessionId: string, @ConnectedSocket() client: Socket) {
    client.leave(sessionId);
    console.log(`[WebSocket] Client ${client.id} left session ${sessionId}`);
    return { event: 'left', data: sessionId };
  }
}
