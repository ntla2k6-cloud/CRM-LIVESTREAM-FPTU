import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ['http://localhost:3000', 'https://crm-livestream-fptu.vercel.app', 'https://www.tiktok.com', 'chrome-extension://*'];
  
  app.enableCors({
    // Chuỗi 'chrome-extension://*' không phải wildcard thật → kiểm tra prefix cho extension
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || origin.startsWith('chrome-extension://') || allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
