import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShiftService } from './shift.service.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Roles('SAN_XUAT')
  @Post()
  create(@Body() createShiftDto: any) {
    return this.shiftService.create(createShiftDto);
  }

  @Get()
  findAll() {
    return this.shiftService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftService.findOne(id);
  }

  @Roles('SAN_XUAT')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: any) {
    return this.shiftService.update(id, updateShiftDto);
  }

  @Roles('SAN_XUAT')
  @Delete('assignment/:assignmentId')
  removeStaff(@Param('assignmentId') assignmentId: string) {
    return this.shiftService.removeAssignment(assignmentId);
  }

  @Roles('SAN_XUAT')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftService.remove(id);
  }

  @Roles('SAN_XUAT')
  @Post(':id/assign')
  assignStaff(@Param('id') id: string, @Body() body: any) {
    return this.shiftService.assignStaff(id, body);
  }
}
