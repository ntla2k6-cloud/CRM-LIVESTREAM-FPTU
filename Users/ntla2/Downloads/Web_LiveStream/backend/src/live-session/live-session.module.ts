import { Module } from '@nestjs/common';
import { LiveSessionService } from './live-session.service.js';
import { LiveSessionController } from './live-session.controller.js';

@Module({
  controllers: [LiveSessionController],
  providers: [LiveSessionService],
})
export class LiveSessionModule {}
