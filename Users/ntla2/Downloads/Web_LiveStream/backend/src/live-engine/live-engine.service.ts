import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LiveEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CORE ENGINE: Process a correct answer and assign winner safely using Transactions (Race-condition free).
   */
  async processWinner(liveSessionId: string, questionId: string, customerId: string, giftId: number) {
    // We use a transaction to ensure no two requests can win the same question simultaneously.
    return await this.prisma.$transaction(async (tx) => {
      // 1. Check if question already has a winner
      const existingWinner = await tx.winner.findFirst({
        where: { questionId }
      });

      if (existingWinner) {
        throw new ConflictException('Câu hỏi này đã có người trúng thưởng!');
      }

      // 2. Check gift stock (Optional, if we want to decrement stock)
      const gift = await tx.gift.findUnique({
        where: { id: giftId }
      });

      if (!gift || gift.stock <= 0) {
        throw new ConflictException('Quà tặng này đã hết hàng!');
      }

      // 3. Decrement gift stock safely
      await tx.gift.update({
        where: { id: giftId },
        data: { stock: { decrement: 1 } }
      });

      // 4. Create Winner record
      const winner = await tx.winner.create({
        data: {
          liveSessionId,
          questionId,
          customerId,
          giftId,
          status: 'PENDING_INFO'
        }
      });

      return winner;
    });
  }

  // Hook for TikTok comments
  async processComment(liveSessionId: string, tiktokUsername: string, comment: string) {
    // 1. Find or create Customer based on TikTok username
    const customer = await this.prisma.customer.findFirst({
      where: { tiktokAccount: tiktokUsername }
    });

    let customerId = customer?.id;

    if (!customerId) {
      const newCustomer = await this.prisma.customer.create({
        data: {
          fullName: tiktokUsername,
          tiktokAccount: tiktokUsername
        }
      });
      customerId = newCustomer.id;
    }

    // 2. Add to Comment pipeline
    return await this.prisma.liveComment.create({
      data: {
        liveSessionId,
        customerId,
        username: tiktokUsername,
        content: comment,
        aiIntent: 'NEUTRAL' // Can be classified later
      }
    });
  }

  // --- TIKTOK LIVE CONNECTOR ---
  private activeConnections = new Map<string, any>(); // liveSessionId -> connection

  async connectToTiktok(liveSessionId: string, tiktokUsername: string, server: any) {
    // Disconnect if already exists
    this.disconnectFromTiktok(liveSessionId);

    // Import dynamically or use require (commonjs)
    const { WebcastPushConnection } = require('tiktok-live-connector');
    const connection = new WebcastPushConnection(tiktokUsername);

    connection.on('chat', async (data: any) => {
      console.log(`[TikTok ${tiktokUsername}] ${data.uniqueId}: ${data.comment}`);
      try {
        const savedComment = await this.processComment(liveSessionId, data.uniqueId, data.comment);
        // Broadcast the saved comment to the specific live session room
        server.to(liveSessionId).emit('newComment', savedComment);
      } catch (err: any) {
        console.error('Lỗi khi xử lý comment TikTok:', err.message);
      }
    });

    connection.on('gift', (data: any) => {
      if (data.giftType === 1 && !data.repeatEnd) {
        // Streak in progress => wait
      } else {
        server.to(liveSessionId).emit('tiktokEvent', { type: 'gift', text: `${data.uniqueId} đã tặng ${data.giftName}` });
      }
    });

    try {
      await connection.connect();
      console.log(`Connected to TikTok Live: ${tiktokUsername}`);
      this.activeConnections.set(liveSessionId, connection);
    } catch (err: any) {
      console.error(`Lỗi kết nối TikTok Live:`, err);
      throw err;
    }
  }

  disconnectFromTiktok(liveSessionId: string) {
    const connection = this.activeConnections.get(liveSessionId);
    if (connection) {
      connection.disconnect();
      this.activeConnections.delete(liveSessionId);
      console.log(`Disconnected TikTok for session ${liveSessionId}`);
    }
  }
}
