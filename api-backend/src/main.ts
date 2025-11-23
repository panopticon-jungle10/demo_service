import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { MonitoringSDK } from '@panopticon/nestjs-monitoring-sdk';

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

  // Winston을 NestJS 기본 logger로 설정
  const nestWinstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(nestWinstonLogger);

  // NestJS wrapper에서 실제 winston logger 인스턴스 가져오기
  const actualWinstonLogger = nestWinstonLogger.getWinstonLogger();

  // Monitoring SDK 초기화 - 실제 winston logger 인스턴스 전달
  const sdk = MonitoringSDK.init(app, {
    apiKey: process.env.SDK_API_KEY || 'demo-service-api-key',
    endpoint: 'http://localhost:3005/producer',
    logEndpoint: 'http://localhost:3005/producer/sdk/logs',
    traceEndpoint: 'http://localhost:3005/producer/sdk/traces',
    serviceName: 'demo-service-api',
    environment: process.env.NODE_ENV || 'development',
    logger: actualWinstonLogger, // NestJS wrapper가 실제로 사용하는 winston 인스턴스
  });

  // TypeORM DataSource에 DB logger 설정
  const dataSource = app.get(DataSource);
  // @ts-ignore - TypeORM 내부 API 사용
  dataSource.logger = sdk.getDbLogger();
  console.log('[main.ts] DB logger set to SDK logger');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API Backend is running on: http://localhost:${port}`);
}
bootstrap();
