import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrderService } from './order.service.js';

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

  // Customer tracking — search by trackingCode, orderId, or phone
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
