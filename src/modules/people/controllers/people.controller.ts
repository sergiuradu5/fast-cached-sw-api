import { CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, Header, Param, Query, UseInterceptors } from '@nestjs/common';
import { HttpCacheInterceptor } from 'src/modules/cache/interceptors/http-cache.interceptor';
import { GetItemByIdRequestParamDto } from 'src/modules/common/dto/get-item-by-id-request-param.dto';
import { GetPeopleRequestQueryDto } from '../dtos/get-people-request.dto';
import { PeopleService } from '../services/people.service';

@Controller('people')
export class PeopleController {
  constructor(private peopleService: PeopleService) { }

  @Get()
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getPeople(
    @Query() query: GetPeopleRequestQueryDto,
  ) {
    return this.peopleService.getPeople({ search: query.search });
  }

  @Get(':id')
  @Header('Cache-Control', 'max-age=60')
  @UseInterceptors(HttpCacheInterceptor)
  @CacheTTL(60 * 1000)
  async getPersonById(
    @Param() { id }: GetItemByIdRequestParamDto,
  ) {
    return this.peopleService.getPersonById({ id });
  }
}
