import { Module } from '@nestjs/common';
import { LeadService } from './lead.service.js';
import { LeadController } from './lead.controller.js';

@Module({
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}
