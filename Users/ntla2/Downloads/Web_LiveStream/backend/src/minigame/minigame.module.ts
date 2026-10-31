import { Module } from '@nestjs/common';
import { MinigameGateway } from './minigame.gateway.js';
import { MinigameService } from './minigame.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommentEngineModule } from '../comment-engine/comment-engine.module.js';
import { QuestionController } from './question.controller.js';
import { QuestionService } from './question.service.js';

@Module({
  imports: [PrismaModule, CommentEngineModule],
  controllers: [QuestionController],
  providers: [MinigameGateway, MinigameService, QuestionService],
  exports: [MinigameService],
})
export class MinigameModule {}
