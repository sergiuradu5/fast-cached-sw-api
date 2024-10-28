import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './modules/cache/cache.module';
import { HttpModule } from './modules/http/http.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PeopleModule } from './modules/people/people.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
      ignoreUserAgents: [/bot|crawler|spider|crawl/i],
      skipIf: (ctx) => {
        const req = ctx.switchToHttp().getRequest();
        return req.hostname === 'localhost';
      }
    }]),
    CacheModule, LoggerModule, HttpModule, PeopleModule, HttpModule],
  controllers: [],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  }],
})
export class AppModule { }
