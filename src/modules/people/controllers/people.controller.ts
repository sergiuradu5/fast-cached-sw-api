import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Header, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { HttpCacheInterceptor } from 'src/modules/cache/interceptors/http-cache.interceptor';
import { GetPeopleRequestQueryDto } from '../dtos/get-people-request.dto';
import { PeopleService } from '../services/people.service';

@Controller('people')
export class PeopleController {
  constructor(private peopleService: PeopleService) { }

  @Get()
  @Header('Cache-Control', 'max-age=60')
  // NOTE: use @UseInterceptors(CacheInterceptor) and @CacheTTL() if you want to cache the response
  // If you want to see how the internal caching system works, leave @UseInterceptors(HttpCacheInterceptor) commented out
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getPeople(
    @Query(new ValidationPipe()) query: GetPeopleRequestQueryDto,
  ) {
    // await new Promise(resolve => setTimeout(resolve, 1000));
    return this.peopleService.getPeople({ search: query.search });
  }
}
