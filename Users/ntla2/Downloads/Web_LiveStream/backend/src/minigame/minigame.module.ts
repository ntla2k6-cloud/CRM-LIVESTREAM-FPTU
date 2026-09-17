import { Module } from '@nestjs/common';
import { MinigameGateway } from './minigame.gateway.js';
import { MinigameService } from './minigame.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [MinigameGateway, MinigameService],
  exports: [MinigameService],
})
export class MinigameModule {}
