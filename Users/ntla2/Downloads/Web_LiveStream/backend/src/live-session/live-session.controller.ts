import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LiveSessionService } from './live-session.service.js';

@Controller('live-session')
export class LiveSessionController {
  constructor(private readonly liveSessionService: LiveSessionService) {}

  @Post()
  create(@Body() createLiveSessionDto: any) {
    return this.liveSessionService.create(createLiveSessionDto);
  }

  @Get()
  findAll() {
    return this.liveSessionService.findAll();
  }

  // Phải đứng trước ':id' để không bị hiểu là id = "overview"
  @Get('overview')
  overview() {
    return this.liveSessionService.overview();
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.liveSessionService.getHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.liveSessionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLiveSessionDto: any) {
    return this.liveSessionService.update(id, updateLiveSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.liveSessionService.remove(id);
  }
}
