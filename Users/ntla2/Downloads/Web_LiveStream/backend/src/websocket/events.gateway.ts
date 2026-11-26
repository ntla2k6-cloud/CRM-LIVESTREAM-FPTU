import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_PREFIX, verifyToken } from '../auth/extension-token.js';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Chỉ người đã đăng nhập CRM (mã fs1 do /api/socket/token ký bằng INTERNAL_API_KEY) mới nhận realtime
  // comment/lead (có SĐT). Chưa đặt INTERNAL_API_KEY → chế độ cũ (mở) để không sập khi deploy.
  handleConnection(client: Socket) {
    const key = process.env.INTERNAL_API_KEY;
    if (key && !verifyToken(SOCKET_PREFIX, client.handshake?.auth?.token, key)) {
      client.emit('authError', 'Phiên kết nối realtime không hợp lệ — tải lại trang');
      client.disconnect(true);
      return;
    }
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
