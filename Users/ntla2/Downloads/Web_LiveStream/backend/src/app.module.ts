import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { MinigameModule } from './minigame/minigame.module.js';
import { StaffModule } from './staff/staff.module.js';
import { LiveSessionModule } from './live-session/live-session.module.js';
import { LeadModule } from './lead/lead.module.js';
import { ShiftModule } from './shift/shift.module.js';
import { OrderModule } from './order/order.module.js';
import { GiftModule } from './gift/gift.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { LiveEngineModule } from './live-engine/live-engine.module.js';
import { TaskModule } from './task/task.module.js';

@Module({
  imports: [PrismaModule, MinigameModule, StaffModule, LiveSessionModule, LeadModule, ShiftModule, OrderModule, GiftModule, DashboardModule, LiveEngineModule, TaskModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
