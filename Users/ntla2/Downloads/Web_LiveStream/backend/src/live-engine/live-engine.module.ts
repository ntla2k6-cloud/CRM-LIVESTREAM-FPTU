import { Module } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';
import { LiveEngineController } from './live-engine.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommentEngineModule } from '../comment-engine/comment-engine.module.js';

@Module({
  imports: [PrismaModule, CommentEngineModule],
  controllers: [LiveEngineController],
  providers: [LiveEngineService],
  exports: [LiveEngineService],
})
export class LiveEngineModule {}
