import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveEngineService } from './live-engine.service.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly liveEngineService: LiveEngineService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Frontend joins a specific live session room
  @SubscribeMessage('joinLiveSession')
  handleJoinLiveSession(@MessageBody() liveSessionId: string, @ConnectedSocket() client: Socket) {
    client.join(liveSessionId);
    console.log(`Client ${client.id} joined session ${liveSessionId}`);
    return { event: 'joined', data: liveSessionId };
  }
  
  // Frontend requests to start TikTok connection
  @SubscribeMessage('startTiktokConnection')
  async handleStartTiktok(@MessageBody() payload: { liveSessionId: string, tiktokUsername: string }) {
    try {
      await this.liveEngineService.connectToTiktok(payload.liveSessionId, payload.tiktokUsername, this.server);
      return { event: 'tiktokStatus', data: { status: 'connected', username: payload.tiktokUsername } };
    } catch (e: any) {
      return { event: 'tiktokStatus', data: { status: 'error', message: e.message } };
    }
  }

  // Frontend requests to stop TikTok connection
  @SubscribeMessage('stopTiktokConnection')
  handleStopTiktok(@MessageBody() liveSessionId: string) {
    this.liveEngineService.disconnectFromTiktok(liveSessionId);
    return { event: 'tiktokStatus', data: { status: 'disconnected' } };
  }
}
