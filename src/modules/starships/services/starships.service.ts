import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { CacheManagerService } from 'src/modules/cache/cache-manager.service';
import { arrayFromRange } from 'src/modules/common/utils/array-from-range';
import { getLastParamFromUrl } from 'src/modules/common/utils/get-last-param-from-url';
import { CachedHttpService } from 'src/modules/http/cached-http.service';
import { ApiResponse } from 'src/modules/people/interfaces/api-response.interface';
import { MappedStarship } from 'src/modules/people/interfaces/mapped-starship.interface';
import { StarWarsStarship } from 'src/modules/people/interfaces/star-wars-starship.interface';
import { GET_APP_URL } from 'src/setup/global-constants';

@Injectable()
export class StarshipsService {
  private readonly logger = new Logger(StarshipsService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly cachedHttpService: CachedHttpService,
  ) { }

  async getStarships({ search }: { search?: string }): Promise<MappedStarship[]> {
    const swApiFirstPageUrl = new URL('starships', process.env.SW_API_BASE_URL);
    if (!isEmpty(search)) {
      swApiFirstPageUrl.searchParams.append('search', search);
    }
    swApiFirstPageUrl.searchParams.append('page', '1');
    const firstPageResponse = await this.cachedHttpService.get<
      ApiResponse<StarWarsStarship>
    >(swApiFirstPageUrl.href);

    const { count, next, results: resultsFromFirstPage } = firstPageResponse.data;

    const promises: Promise<MappedStarship[]>[] = [];
    const mappedStarshipsFromFirstPagePromise = this.mapStarships({
      swStarships: resultsFromFirstPage,
    });
    promises.push(mappedStarshipsFromFirstPagePromise);

    if (!isNil(next)) {
      const resultsPerPage = resultsFromFirstPage.length;
      const totalPages = Math.ceil(count / resultsPerPage);
      const pagesArray = arrayFromRange(2, totalPages);
      const restOfPagesPromises = pagesArray.map(async (page) => {
        const swApiCurrentPageUrl = new URL('starships', process.env.SW_API_BASE_URL);
        if (!isEmpty(search)) {
          swApiCurrentPageUrl.searchParams.append('search', search);
        }
        swApiCurrentPageUrl.searchParams.append('page', page.toString());
        const response = await this.cachedHttpService.get<
          ApiResponse<StarWarsStarship>
        >(swApiCurrentPageUrl.href);
        const { results: resultsFromCurrentPage } = response.data;
        const mappedStarshipsFromCurrentPagePromise = this.mapStarships({
          swStarships: resultsFromCurrentPage,
        });
        return mappedStarshipsFromCurrentPagePromise;
      });

      promises.push(...restOfPagesPromises);
    }

    const mappedStarships = (await Promise.all(promises)).flat(1);

    this.logger.log(
      `Cache hit/lookup ratio for current req: ${this.cacheManagerService.getCacheHitCounter()}/${this.cacheManagerService.getCacheLookupCounter()}`,
    );

    this.logger.log(
      `Requests fetched for current req: ${this.cachedHttpService.getFetchCounter()}`,
    );

    this.cacheManagerService.resetCounters();
    this.cachedHttpService.resetFetchCounter();
    return mappedStarships;
  }

  private async mapStarships({
    swStarships,
  }: {
    swStarships: StarWarsStarship[];
  }): Promise<MappedStarship[]> {
    const mappedStarships = await Promise.all(
      swStarships.map(async (swStarship) => {
        const id = getLastParamFromUrl(swStarship.url);
        const cacheKey = this.getMappedStarshipCachedKey(id);
        const mappedStarshipFromCache =
          await this.cacheManagerService.get<MappedStarship>(cacheKey);
        if (!isNil(mappedStarshipFromCache)) {
          return mappedStarshipFromCache;
        }

        const { name, model, manufacturer, starship_class: vehicleClass } = swStarship;

        const appUrl = GET_APP_URL();

        const image = new URL(`public/static/assets/img/starships/${id}.jpg`, appUrl,).href;

        const mappedStarship: MappedStarship = {
          id,
          name,
          model,
          manufacturer,
          vehicleClass,
          image,
        };
        await this.cacheManagerService.set(cacheKey, mappedStarship);
        return mappedStarship;
      }),
    );
    return mappedStarships;
  }

  private getMappedStarshipCachedKey(id: string): string {
    return `starship:${id}`;
  }
}