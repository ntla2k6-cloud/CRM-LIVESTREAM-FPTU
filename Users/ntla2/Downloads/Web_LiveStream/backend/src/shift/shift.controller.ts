import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShiftService } from './shift.service.js';

@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  create(@Body() createShiftDto: any) { return null; }

  @Get()
  findAll() { return []; }

  @Get(':id')
  findOne(@Param('id') id: string) { return null; }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: any) { return null; }

  @Delete(':id')
  remove(@Param('id') id: string) { return null; }

  @Post(':id/assign')
  assignStaff(@Param('id') id: string, @Body('staffId') staffId: number) { return null; }

  @Delete('assignment/:assignmentId')
  removeStaff(@Param('assignmentId') assignmentId: string) { return null; }
}
