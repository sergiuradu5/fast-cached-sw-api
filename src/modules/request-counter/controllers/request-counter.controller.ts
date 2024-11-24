import { Controller, Get } from '@nestjs/common';
import { RequestCounterService } from '../services/request-counter.service';

@Controller('request-counter')
export class RequestCounterController {
  constructor(private readonly requestCounterService: RequestCounterService,
  ) { }

  @Get('')
  async getRequestCounter(): Promise<any> {
    const count = await this.requestCounterService.getRequestCounter();
    return {
      count: count ?? null,
    }
  }
}
