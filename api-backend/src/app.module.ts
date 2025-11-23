import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot({}),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: +process.env.DATABASE_PORT || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'demo_service',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      ...(process.env.NODE_ENV === 'production' && { ssl: { rejectUnauthorized: false } }),
      synchronize: process.env.NODE_ENV === 'production' ? true : false,
      logging: true,
      maxQueryExecutionTime: 1, // 1ms 이상 걸리는 쿼리를 logQuerySlow로 전달 (거의 모든 쿼리)
    }),
    PostsModule,
    CommentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
