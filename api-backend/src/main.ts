import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { MonitoringSDK } from '@woongno/nestjs-monitoring-sdk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://qna.jungle-panopticon.cloud',
      'https://demo-service-two.vercel.app', // 추가
    ],
    credentials: true,
  });

  // Winston Logger 가져오기
  const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  // Monitoring SDK 초기화
  MonitoringSDK.init(app, {
    apiKey: 'demo-service-api-key',
    endpoint: 'http://localhost:3005/producer/sdk/log',
    serviceName: 'demo-service-api',
    environment: process.env.NODE_ENV || 'development',
    logger: winstonLogger, // Winston logger 직접 전달
  });

  // Winston을 NestJS 기본 logger로 설정
  app.useLogger(winstonLogger);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API Backend is running on: http://localhost:${port}`);
}
bootstrap();
