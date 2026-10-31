import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service.js';

@WebSocketGateway({ cors: true })
export class MinigameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  // Mở/đóng câu hỏi đi qua REST có xác thực: POST /question/:id/start|end (QuestionService),
  // không nhận qua socket vì socket chưa xác thực.

  // Người xem trả lời bằng comment A/B/C/D trên TikTok (QuizService), không có trang web riêng
  // để không kéo người xem rời khỏi LIVE.

  // Mô phỏng nhận luồng comment liên tục (giả lập webhook từ TikTok)
  // Thực tế cái này sẽ nằm ở một Controller nhận HTTP Webhook, sau đó gọi Gateway để đẩy xuống UI
  broadcastNewComment(comment: any) {
    this.server.emit('newComment', comment);
  }

  broadcastLeaderboardUpdate(leaderboard: any[]) {
    this.server.emit('leaderboardUpdate', leaderboard);
  }
}
