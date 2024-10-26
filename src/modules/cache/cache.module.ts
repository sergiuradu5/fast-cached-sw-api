import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { CacheManagerService } from './cache-manager.service';
@Global()
@Module({
  imports: [
    NestCacheModule.register({
      isGlobal: true,
      ttl: 0,
      max: 4000,
      store: 'memory',
    }),
  ],
  providers: [CacheManagerService],
  exports: [CacheManagerService],
})
export class CacheModule {}
