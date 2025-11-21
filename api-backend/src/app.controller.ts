import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth(): { status: string; message: string } {
    return {
      status: 'ok bto',
      message: 'API Backend is running',
    };
  }
}
