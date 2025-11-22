import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from 'typeorm';

// DB logger를 저장할 전역 변수
export let dbLogger: Logger | null = null;

export const setDbLogger = (logger: Logger) => {
  dbLogger = logger;
};

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: +process.env.DATABASE_PORT || 5432,
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'demo_service',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: true,
    logger: dbLogger || 'advanced-console', // dbLogger가 설정되면 사용, 아니면 기본 logger
  };
};
