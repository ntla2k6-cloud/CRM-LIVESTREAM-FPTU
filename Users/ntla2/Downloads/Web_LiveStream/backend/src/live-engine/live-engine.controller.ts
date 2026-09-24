import { Controller, Post, Body } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';

@Controller('live-engine')
export class LiveEngineController {
  constructor(private readonly liveEngineService: LiveEngineService) {}

  @Post('winner')
  async declareWinner(
    @Body() body: { liveSessionId: string; questionId: string; customerId: string; giftId: number }
  ) {
    return this.liveEngineService.processWinner(
      body.liveSessionId,
      body.questionId,
      body.customerId,
      body.giftId
    );
  }

  @Post('comment')
  async handleIncomingComment(
    @Body() body: { liveSessionId: string; tiktokUsername: string; comment: string }
  ) {
    return this.liveEngineService.processComment(
      body.liveSessionId,
      body.tiktokUsername,
      body.comment
    );
  }
}
