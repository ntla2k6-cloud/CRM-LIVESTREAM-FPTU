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

  // Mở/đóng câu hỏi đi qua REST có xác thực: POST /question/:id/start|end (QuestionService),
  // không nhận qua socket vì socket chưa xác thực.

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
