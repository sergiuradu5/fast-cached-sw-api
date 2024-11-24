import { Module } from '@nestjs/common';
import { RequestCounterController } from './controllers/request-counter.controller';
import { RequestCounterService } from './services/request-counter.service';

@Module({
  controllers: [RequestCounterController],
  providers: [RequestCounterService]
})
export class RequestCounterModule { }
