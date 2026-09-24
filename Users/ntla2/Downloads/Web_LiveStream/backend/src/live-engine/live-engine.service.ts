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
          name: tiktokUsername,
          tiktokAccount: tiktokUsername,
          aiIntent: 'NEUTRAL' // can be passed to AI logic later
        }
      });
      customerId = newCustomer.id;
    }

    // 2. Add to Comment pipeline
    return await this.prisma.answer.create({
      data: {
        liveSessionId,
        customerId,
        content: comment,
        isCorrect: false // To be evaluated by Quiz logic
      }
    });
  }
}
