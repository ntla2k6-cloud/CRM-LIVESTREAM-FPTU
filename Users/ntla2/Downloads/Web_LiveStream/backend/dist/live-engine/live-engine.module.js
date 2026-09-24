var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';
import { LiveEngineController } from './live-engine.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LiveGateway } from './live.gateway.js';
let LiveEngineModule = class LiveEngineModule {
};
LiveEngineModule = __decorate([
    Module({
        imports: [PrismaModule],
        controllers: [LiveEngineController],
        providers: [LiveEngineService, LiveGateway],
        exports: [LiveEngineService, LiveGateway],
    })
], LiveEngineModule);
export { LiveEngineModule };
//# sourceMappingURL=live-engine.module.js.map