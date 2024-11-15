import { Injectable, Logger } from "@nestjs/common";
import { isEmpty, isNil } from "lodash";
import { CacheManagerService } from "src/modules/cache/cache-manager.service";
import { arrayFromRange } from "src/modules/common/utils/array-from-range";
import { getLastParamFromUrl } from "src/modules/common/utils/get-last-param-from-url";
import { MappedFilm } from "src/modules/films/interfaces/mapped-film.interface";
import { StarWarsFilm } from "src/modules/films/interfaces/star-wars-film.interface";
import { CachedHttpService } from "src/modules/http/cached-http.service";
import { ApiResponse } from "src/modules/people/interfaces/api-response.interface";
import { GET_APP_URL } from "src/setup/global-constants";
import { MAPPED_FILM_CACHE_KEY } from "../constants/films-cache-keys.constants";

@Injectable()
export class FilmsService {
  private readonly logger = new Logger(FilmsService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly cachedHttpService: CachedHttpService,
  ) { }

  async getFilms({ search }: { search?: string }): Promise<MappedFilm[]> {
    const swApiFirstPageUrl = new URL('films', process.env.SW_API_BASE_URL);
    if (!isEmpty(search)) {
      swApiFirstPageUrl.searchParams.append('search', search);
    }
    swApiFirstPageUrl.searchParams.append('page', '1');
    const firstPageResponse = await this.cachedHttpService.get<
      ApiResponse<StarWarsFilm>
    >(swApiFirstPageUrl.href);

    const {
      count,
      next,
      results: resultsFromFirstPage,
    } = firstPageResponse.data;

    const promises: Promise<MappedFilm[]>[] = [];
    const mappedPeopleFromFirstPagePromise = this.mapFilms({
      swFilms: resultsFromFirstPage,
    });
    promises.push(mappedPeopleFromFirstPagePromise);

    if (!isNil(next)) {
      const resultsPerPage = resultsFromFirstPage.length;
      const totalPages = Math.ceil(count / resultsPerPage);
      const pagesArray = arrayFromRange(2, totalPages);
      const restOfPagesPromises = pagesArray.map(async (page) => {
        const swApiCurrentPageUrl = new URL('films', process.env.SW_API_BASE_URL);
        if (!isEmpty(search)) {
          swApiCurrentPageUrl.searchParams.append('search', search);
        }
        swApiCurrentPageUrl.searchParams.append('page', page.toString());
        const response = await this.cachedHttpService.get<
          ApiResponse<StarWarsFilm>
        >(swApiCurrentPageUrl.href);
        const { results: resultsFromCurrentPage } = response.data;
        const mappedPeopleFromCurrentPagePromise = this.mapFilms({
          swFilms: resultsFromCurrentPage,
        });
        return mappedPeopleFromCurrentPagePromise;
      });

      promises.push(...restOfPagesPromises);
    }

    const mappedPeople = (await Promise.all(promises)).flat(1);

    this.logger.log(
      `Cache hit/lookup ratio for current req: ${this.cacheManagerService.getCacheHitCounter()}/${this.cacheManagerService.getCacheLookupCounter()}`,
    );

    this.logger.log(
      `Requests fetched for current req: ${this.cachedHttpService.getFetchCounter()}`,
    );

    this.cacheManagerService.resetCounters();
    this.cachedHttpService.resetFetchCounter();
    return mappedPeople;
  }

  private async mapFilms({
    swFilms: swFilms,
  }: {
    swFilms: StarWarsFilm[];
  }): Promise<MappedFilm[]> {
    const mappedFilms = await Promise.all(
      swFilms.map(async (swFilm) => {
        const id = getLastParamFromUrl(swFilm.url);
        const cacheKey = this.getMappedFilmCachedKey(id);
        const mappedPersonFromCache =
          await this.cacheManagerService.get<MappedFilm>(cacheKey);
        if (!isNil(mappedPersonFromCache)) {
          return mappedPersonFromCache;
        }
        const appUrl = GET_APP_URL()

        const image = new URL(`public/static/assets/img/films/${id}.jpg`, appUrl,).href;

        const { director, producer, title, release_date, } = swFilm;

        const mappedFilm: MappedFilm = {
          id,
          director,
          producer,
          title,
          releaseDate: release_date,
          image,
        };
        await this.cacheManagerService.set(cacheKey, mappedFilm);
        return mappedFilm;
      }),
    );
    return mappedFilms;
  }
  getMappedFilmCachedKey(id: any) {
    return `${MAPPED_FILM_CACHE_KEY}:${id}`;
  }
}