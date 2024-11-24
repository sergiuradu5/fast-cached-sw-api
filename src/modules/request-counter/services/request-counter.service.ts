import { Injectable } from '@nestjs/common';
import { CacheManagerService } from 'src/modules/cache/cache-manager.service';
import { CACHED_HTTP_REQUEST_COUNTER_KEY } from 'src/modules/http/constants';

@Injectable()
export class RequestCounterService {
  constructor(private cacheManagerService: CacheManagerService) {}

  public async getRequestCounter(): Promise<number> {
    return this.cacheManagerService.get<number>(CACHED_HTTP_REQUEST_COUNTER_KEY);
  }
}
