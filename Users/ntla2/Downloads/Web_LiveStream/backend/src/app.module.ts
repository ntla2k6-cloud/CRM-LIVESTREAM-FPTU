import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { MinigameModule } from './minigame/minigame.module.js';
import { StaffModule } from './staff/staff.module.js';
import { LiveSessionModule } from './live-session/live-session.module.js';
import { LeadModule } from './lead/lead.module.js';
import { ShiftModule } from './shift/shift.module.js';

@Module({
  imports: [PrismaModule, MinigameModule, StaffModule, LiveSessionModule, LeadModule, ShiftModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
