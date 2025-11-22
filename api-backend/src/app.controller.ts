import { Controller, Get, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller()
export class AppController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Get()
  getHealth(): { status: string; message: string } {
    this.logger.log('GET / endpoint called', AppController.name);
    this.logger.warn('This is a warning message', AppController.name);
    this.logger.error('This is an error message', '', AppController.name);

    return {
      status: 'ok bto',
      message: 'API Backend is running',
    };
  }
}
