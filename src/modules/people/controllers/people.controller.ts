import { Controller, Get, Header, Query, ValidationPipe } from '@nestjs/common';
import { GetPeopleRequestQueryDto } from '../dtos/get-people-request.dto';
import { PeopleService } from '../services/people.service';

@Controller('people')
export class PeopleController {
  constructor(private peopleService: PeopleService) {}

  @Get()
  @Header('Cache-Control', 'max-age=60')
  // NOTE: use @UseInterceptors(CacheInterceptor) and @CacheTTL() if you want to cache the response
  // If you want to see how the internal caching system works, leave @UseInterceptors(CacheInterceptor) commented out
  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(60)
  async getPeople(
    @Query(new ValidationPipe()) query: GetPeopleRequestQueryDto,
  ) {
    return this.peopleService.getPeople({ search: query.search });
  }
}
