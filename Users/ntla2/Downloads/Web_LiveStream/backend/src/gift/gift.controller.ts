import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, ParseIntPipe } from '@nestjs/common';
import { GiftService } from './gift.service.js';
import { GiftStockService } from './gift-stock.service.js';
import { Roles } from '../auth/roles.decorator.js';
import { actorOf } from '../auth/actor.js';

@Controller('gift')
export class GiftController {
  constructor(private readonly giftService: GiftService, private readonly stock: GiftStockService) {}

  @Roles('THU_KHO')
  @Post()
  create(@Body() body: any, @Headers() h: any) {
    return this.giftService.create(body, actorOf(h));
  }

  @Get()
  findAll() {
    return this.giftService.findAll();
  }

  @Get(':id/movements')
  movements(@Param('id', ParseIntPipe) id: number) {
    return this.stock.movements(id);
  }

  @Roles('THU_KHO')
  @Post(':id/import')
  importStock(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Headers() h: any) {
    return this.stock.importStock(id, body, actorOf(h));
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.giftService.findOne(id);
  }

  @Roles('THU_KHO')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Headers() h: any) {
    return this.giftService.update(id, body, actorOf(h));
  }

  @Roles('THU_KHO')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.giftService.remove(id);
  }
}
