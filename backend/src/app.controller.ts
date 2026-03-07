import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    this.logger.log('Health check requested');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'courier-backend',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
