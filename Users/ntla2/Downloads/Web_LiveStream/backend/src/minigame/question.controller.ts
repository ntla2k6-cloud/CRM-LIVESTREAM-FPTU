import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { QuestionService, type QuestionInput } from './question.service.js';

@Controller('question')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  findBySession(@Query('liveSessionId') liveSessionId: string) {
    return this.questionService.findBySession(liveSessionId);
  }

  @Post()
  create(@Body() body: QuestionInput) {
    return this.questionService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: QuestionInput) {
    return this.questionService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionService.remove(id);
  }

  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.questionService.start(id);
  }

  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.questionService.end(id);
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string) {
    return this.questionService.leaderboard(id);
  }
}
