import { Module } from '@nestjs/common';
import { CacheModule } from './modules/cache/cache.module';
import { HttpModule } from './modules/http/http.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PeopleModule } from './modules/people/people.module';

@Module({
  imports: [CacheModule, LoggerModule, HttpModule, PeopleModule, HttpModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
