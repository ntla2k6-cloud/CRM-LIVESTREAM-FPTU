import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { EquipmentService, type Actor } from './equipment.service.js';

// Người thao tác lấy từ header proxy Next.js gửi (chỉ tin khi có x-internal-key đúng — RolesGuard đã kiểm)
const actorOf = (h: Record<string, any>): Actor => ({
  id: typeof h['x-user-id'] === 'string' ? h['x-user-id'] : undefined,
  name: typeof h['x-user-name'] === 'string' ? decodeURIComponent(h['x-user-name']) : undefined,
  role: typeof h['x-user-role'] === 'string' ? h['x-user-role'] : 'GUEST',
});

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  @Get()
  findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.service.findAll(includeDeleted === 'true');
  }

  @Get('people')
  people() {
    return this.service.people();
  }

  @Get('categories')
  categories() {
    return this.service.categories();
  }

  @Post('categories')
  createCategory(@Body() body: any, @Headers() h: any) {
    return this.service.saveCategory(null, body, actorOf(h));
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: any, @Headers() h: any) {
    return this.service.saveCategory(id, body, actorOf(h));
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string, @Headers() h: any) {
    return this.service.removeCategory(id, actorOf(h));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any, @Headers() h: any) {
    return this.service.create(body, actorOf(h));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Headers() h: any) {
    return this.service.update(id, body, actorOf(h));
  }

  @Post(':id/status')
  setStatus(@Param('id') id: string, @Body() body: any, @Headers() h: any) {
    return this.service.setStatus(id, body, actorOf(h));
  }

  @Post(':id/handover')
  handover(@Param('id') id: string, @Body() body: any, @Headers() h: any) {
    return this.service.handover(id, body, actorOf(h));
  }

  @Post(':id/return')
  returnBack(@Param('id') id: string, @Body() body: any, @Headers() h: any) {
    return this.service.returnBack(id, body, actorOf(h));
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Headers() h: any) {
    return this.service.restore(id, actorOf(h));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers() h: any) {
    return this.service.remove(id, actorOf(h));
  }
}
