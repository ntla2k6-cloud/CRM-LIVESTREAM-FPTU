import { Module } from '@nestjs/common';
import { LiveEngineService } from './live-engine.service.js';
import { LiveEngineController } from './live-engine.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LiveGateway } from './live.gateway.js';

@Module({
  imports: [PrismaModule],
  controllers: [LiveEngineController],
  providers: [LiveEngineService, LiveGateway],
  exports: [LiveEngineService, LiveGateway],
})
export class LiveEngineModule {}
