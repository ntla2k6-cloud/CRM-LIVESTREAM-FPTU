var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { GiftService } from './gift.service.js';
import { GiftController } from './gift.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
let GiftModule = class GiftModule {
};
GiftModule = __decorate([
    Module({
        imports: [PrismaModule],
        controllers: [GiftController],
        providers: [GiftService],
    })
], GiftModule);
export { GiftModule };
//# sourceMappingURL=gift.module.js.map