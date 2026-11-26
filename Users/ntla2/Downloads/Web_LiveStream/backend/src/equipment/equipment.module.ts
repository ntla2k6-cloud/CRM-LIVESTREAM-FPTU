import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EquipmentController } from './equipment.controller.js';
import { EquipmentService } from './equipment.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
