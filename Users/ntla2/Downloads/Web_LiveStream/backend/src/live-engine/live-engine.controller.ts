import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';
import { PipelineService } from '../comment-engine/pipeline.service.js';

@Controller('live-engine')
export class LiveEngineController {
  constructor(
    private readonly liveEngineService: LiveEngineService,
    private readonly pipelineService: PipelineService
  ) {}

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


  @Post('extension-session')
  async resolveExtensionSession(@Body() body: { input: string; title?: string }) {
    return this.liveEngineService.resolveExtensionSession(body?.input, body?.title);
  }

  @Post('extension-comments')
  async handleExtensionComments(
    @Body() body: { liveSessionId: string; comments: Array<{ platformCommentId: string, username: string, displayName?: string, avatar?: string, content: string, timestamp: number }> }
  ) {
    if (!body?.liveSessionId || !Array.isArray(body.comments)) {
      throw new BadRequestException('Thiếu liveSessionId hoặc danh sách comments');
    }
    await this.liveEngineService.assertLiveSessionExists(body.liveSessionId);

    let processed = 0;
    let failed = 0;
    for (const c of body.comments) {
      if (!c?.content || !c.username) continue;
      try {
        await this.pipelineService.processComment(body.liveSessionId, {
          platform: 'extension',
          platformCommentId: c.platformCommentId || Math.random().toString(),
          username: c.username,
          displayName: c.displayName,
          avatar: c.avatar,
          content: c.content,
          timestamp: new Date(c.timestamp || Date.now())
        });
        processed++;
      } catch (e) {
        // 1 comment lỗi không được làm extension gửi lại cả lô
        failed++;
      }
    }
    return { success: true, processed, failed };
  }

  @Post('comment')
  async handleIncomingComment(
    @Body() body: { liveSessionId: string; tiktokUsername: string; comment: string }
  ) {
    return this.pipelineService.processComment(body.liveSessionId, {
      platform: 'manual',
      platformCommentId: Math.random().toString(),
      username: body.tiktokUsername,
      content: body.comment,
      timestamp: new Date()
    });
  }

  @Post('connect')
  async connectTiktok(@Body() body: { liveSessionId: string; tiktokUsername: string }) {
    return this.liveEngineService.connectToTiktok(body.liveSessionId, body.tiktokUsername);
  }

  @Post('resolve')
  async resolveLiveSession(@Body() body: { input: string }) {
    return this.liveEngineService.resolveLiveSession(body.input);
  }
  
  @Post('disconnect')
  async disconnectTiktok(@Body() body: { liveSessionId: string }) {
    return this.liveEngineService.disconnectFromTiktok(body.liveSessionId);
  }

  @Get('status/:liveSessionId')
  async getStatus(@Param('liveSessionId') liveSessionId: string) {
    return { status: this.liveEngineService.getTiktokStatus(liveSessionId) };
  }

  @Get('analytics/:liveSessionId')
  async getAnalytics(@Param('liveSessionId') liveSessionId: string) {
    return this.liveEngineService.getAnalytics(liveSessionId);
  }
}
