import { Module } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { OrderController } from './order.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EmailModule } from '../email/email.module.js';
import { GiftModule } from '../gift/gift.module.js';

@Module({
  imports: [PrismaModule, EmailModule, GiftModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
