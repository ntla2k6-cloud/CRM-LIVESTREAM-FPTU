import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service.js';
import { QuizService } from './quiz.service.js';
import { LeadService } from './lead.service.js';
import { EventsGateway } from '../websocket/events.gateway.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [
    PipelineService,
    QuizService,
    LeadService,
    EventsGateway
  ],
  exports: [
    PipelineService,
    EventsGateway
  ]
})
export class CommentEngineModule {}
