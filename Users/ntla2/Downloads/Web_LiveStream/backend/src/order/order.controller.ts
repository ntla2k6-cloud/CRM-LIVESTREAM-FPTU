import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { Public, Roles } from '../auth/roles.decorator.js';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: any) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll(@Query('sessionId') sessionId?: string) {
    return this.orderService.findAll(sessionId);
  }

  @Roles('THU_KHO')
  @Post('bulk-status')
  bulkStatus(@Body() body: { ids: string[]; status: string; note?: string }) {
    return this.orderService.bulkStatus(body?.ids, body?.status, body?.note);
  }

  @Roles('THU_KHO')
  @Post('bulk-tracking')
  bulkTracking(@Body() body: { rows: Array<{ id?: string; carrier?: string; trackingCode?: string; trackingLink?: string }> }) {
    return this.orderService.bulkTracking(body?.rows);
  }

  @Roles('THU_KHO')
  @Post('congrats')
  sendCongrats(@Body() body: { items: Array<{ id: string; email?: string }>; resend?: boolean }) {
    return this.orderService.sendCongrats(body?.items, !!body?.resend);
  }

  // Customer tracking — search by trackingCode, orderId, or phone
  @Public()
  @Get('tracking/:trackingCode')
  findByTracking(@Param('trackingCode') trackingCode: string) {
    return this.orderService.findByTracking(trackingCode);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.orderService.getHistory(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
