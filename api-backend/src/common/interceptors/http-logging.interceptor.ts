import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    // 요청 시작 로그
    this.logger.log(`[HTTP] ${method} ${url} - 요청 시작`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          // 응답 완료 로그
          const logLevel = this.getLogLevel(statusCode);
          this.logger[logLevel](
            `[HTTP] ${method} ${url} - ${statusCode} (${duration}ms)`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // 에러 로그
          this.logger.error(
            `[HTTP] ${method} ${url} - ${statusCode} (${duration}ms) - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  private getLogLevel(statusCode: number): string {
    if (statusCode >= 500) {
      return 'error';
    } else if (statusCode >= 400) {
      return 'warn';
    }
    return 'log';
  }
}
