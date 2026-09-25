var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [PrismaModule, MinigameModule, StaffModule, LiveSessionModule, LeadModule, ShiftModule, OrderModule, GiftModule, DashboardModule, LiveEngineModule, TaskModule],
        controllers: [AppController],
        providers: [AppService, { provide: APP_GUARD, useClass: RolesGuard }],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map