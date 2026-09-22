import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';

@WebSocketGateway({ cors: true })
export class MinigameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  // Frontend sẽ gọi method này khi người điều khiển bấm "BẮT ĐẦU CHẠY"
  @SubscribeMessage('startGame')
  async handleStartGame(
    @MessageBody() data: { liveSessionId: string; questionCode: string; timeLimit: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Admin started game for question:', data.questionCode);
    
    // Broadcast cho tất cả clients biết game đã bắt đầu
    this.server.emit('gameStarted', {
      questionCode: data.questionCode,
      timeLimit: data.timeLimit,
      startedAt: Date.now(),
    });
    
    // Ở đây có thể lưu trạng thái Question -> ACTIVE vào DB
    return { status: 'success' };
  }

  // Frontend sẽ gọi method này khi bấm "ĐÓNG CÂU HỎI"
  @SubscribeMessage('endGame')
  async handleEndGame(
    @MessageBody() data: { liveSessionId: string; questionCode: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Admin ended game for question:', data.questionCode);
    
    this.server.emit('gameEnded', {
      questionCode: data.questionCode,
    });
    
    // Lưu trạng thái Question -> CLOSED vào DB
    return { status: 'success' };
  }

  // Lắng nghe học sinh trả lời từ trang /play
  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { name: string; phone: string; answer: string; time: string; timestamp: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Student submitted answer:', data);
    // Bắn thẳng lên Admin Panel dưới dạng comment
    this.server.emit('newComment', {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      text: data.answer,
      time: data.time,
      isPhone: true,
      isHighIntent: true,
      timestamp: data.timestamp
    });
    return { status: 'success' };
  }

  // Mô phỏng nhận luồng comment liên tục (giả lập webhook từ TikTok)
  // Thực tế cái này sẽ nằm ở một Controller nhận HTTP Webhook, sau đó gọi Gateway để đẩy xuống UI
  broadcastNewComment(comment: any) {
    this.server.emit('newComment', comment);
  }

  broadcastLeaderboardUpdate(leaderboard: any[]) {
    this.server.emit('leaderboardUpdate', leaderboard);
  }
}
