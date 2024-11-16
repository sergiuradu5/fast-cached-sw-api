import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, Milliseconds, Store } from 'cache-manager';
import { isNil } from 'lodash';
@Injectable()
export class CacheManagerService {
  private cacheHitCounter = 0;
  private cacheLookupCounter = 0;
  private logger = new Logger(CacheManagerService.name);
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) { }

  async get<T>(key: string): Promise<T> {
    const awaitedRespose = await this.cacheManager.get<T>(key);
    this.cacheLookupCounter++;
    if (!isNil(awaitedRespose)) {
      this.cacheHitCounter++;
      this.logger.log(`Cache hit: ${key}`);
    } else {
      this.logger.warn(`Cache miss: ${key}`);
    }
    return awaitedRespose;
  }

  async set(key: string, value: unknown, ttl?: Milliseconds): Promise<void> {
    return this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    return this.cacheManager.del(key);
  }

  getStore(): Store {
    return this.cacheManager.store;
  }

  getCacheHitCounter(): number {
    return this.cacheHitCounter;
  }

  getCacheLookupCounter(): number {
    return this.cacheLookupCounter;
  }
  resetCounters(): void {
    this.cacheLookupCounter = 0;
    this.cacheHitCounter = 0;
  }
}
