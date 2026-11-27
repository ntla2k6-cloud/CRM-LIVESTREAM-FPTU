import { Module } from '@nestjs/common';
import { GiftService } from './gift.service.js';
import { GiftController } from './gift.controller.js';
import { GiftStockService } from './gift-stock.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [GiftController],
  providers: [GiftService, GiftStockService],
  exports: [GiftStockService],
})
export class GiftModule {}
