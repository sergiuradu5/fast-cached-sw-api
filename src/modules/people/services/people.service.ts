import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { CacheManagerService } from 'src/modules/cache/cache-manager.service';
import { arrayFromRange } from 'src/modules/common/utils/array-from-range';
import { getLastParamFromUrl } from 'src/modules/common/utils/get-last-param-from-url';
import { CachedHttpService } from 'src/modules/http/cached-http.service';
import { AsyncMethodLogger } from 'src/modules/logger/decorators/async-method-logger.decorator';
import { TraceSpan } from 'src/modules/logger/decorators/trace-span.decorator';
import { GET_APP_URL } from 'src/setup/global-constants';
import { MappedFilm } from '../../films/interfaces/mapped-film.interface';
import { StarWarsFilm } from '../../films/interfaces/star-wars-film.interface';
import { MAPPED_PERSON_CACHE_KEY } from '../constants/people-cache-keys.constants';
import { ApiResponse } from '../interfaces/api-response.interface';
import { MappedPerson } from '../interfaces/mapped-person.interface';
import { MappedStarship } from '../interfaces/mapped-starship.interface';
import { StarWarsStarship } from '../interfaces/star-wars-starship.interface';
import { StarWarsPerson } from './../interfaces/star-wars-person.interface';
@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(
    private readonly cacheManagerService: CacheManagerService,
    private readonly cachedHttpService: CachedHttpService,
  ) { }

  @TraceSpan()
  @AsyncMethodLogger({ logLevel: 'verbose', logMethodArgs: true, logMethodRetunValue: true })
  async getPeople({ search }: { search?: string }): Promise<MappedPerson[]> {
    const swApiFirstPageUrl = new URL('people', process.env.SW_API_BASE_URL);
    if (!isEmpty(search)) {
      swApiFirstPageUrl.searchParams.append('search', search);
    }
    swApiFirstPageUrl.searchParams.append('page', '1');
    const firstPageResponse = await this.cachedHttpService.get<
      ApiResponse<StarWarsPerson>
    >(swApiFirstPageUrl.href);

    const {
      count,
      next,
      results: resultsFromFirstPage,
    } = firstPageResponse.data;

    const promises: Promise<MappedPerson[]>[] = [];
    const mappedPeopleFromFirstPagePromise = this.mapPeople({
      swPeople: resultsFromFirstPage,
    });
    promises.push(mappedPeopleFromFirstPagePromise);

    if (!isNil(next)) {
      const resultsPerPage = resultsFromFirstPage.length;
      const totalPages = Math.ceil(count / resultsPerPage);
      const pagesArray = arrayFromRange(2, totalPages);
      const restOfPagesPromises = pagesArray.map(async (page) => {
        const swApiCurrentPageUrl = new URL('people', process.env.SW_API_BASE_URL);
        if (!isEmpty(search)) {
          swApiCurrentPageUrl.searchParams.append('search', search);
        }
        swApiCurrentPageUrl.searchParams.append('page', page.toString());
        const response = await this.cachedHttpService.get<
          ApiResponse<StarWarsPerson>
        >(swApiCurrentPageUrl.href);
        const { results: resultsFromCurrentPage } = response.data;
        const mappedPeopleFromCurrentPagePromise = this.mapPeople({
          swPeople: resultsFromCurrentPage,
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
    await this.cachedHttpService.resetFetchCounter();
    return mappedPeople;
  }

  @TraceSpan()
  @AsyncMethodLogger({ logLevel: 'verbose', logMethodArgs: true, logMethodRetunValue: true })
  private async mapPeople({
    swPeople,
  }: {
    swPeople: StarWarsPerson[];
  }): Promise<MappedPerson[]> {
    const mappedPeople = await Promise.all(
      swPeople.map(async (swPerson) => {
        const id = getLastParamFromUrl(swPerson.url);
        const cacheKey = this.getMappedPersonCachedKey(id);
        const mappedPersonFromCache =
          await this.cacheManagerService.get<MappedPerson>(cacheKey);
        if (!isNil(mappedPersonFromCache)) {
          return mappedPersonFromCache;
        }
        const appUrl = GET_APP_URL()

        const image = new URL(`public/static/assets/img/people/${id}.jpg`, appUrl,).href;

        const starships: MappedStarship[] = await this.getStarships({
          swStarshipUrls: swPerson.starships,
        });

        // NOTE: Also added films in order to showcase modularity of existing code
        const films: MappedFilm[] = await this.getFilms({ swFilmUrls: swPerson.films });

        const { name, height, mass, gender } = swPerson;

        const mappedPerson: MappedPerson = {
          id,
          name,
          height,
          mass,
          gender,
          starships,
          films,
          image,
        };
        await this.cacheManagerService.set(cacheKey, mappedPerson);
        return mappedPerson;
      }),
    );
    return mappedPeople;
  }

  private async getStarships({
    swStarshipUrls,
  }: {
    swStarshipUrls: string[];
  }): Promise<MappedStarship[]> {
    const mappedStarships: MappedStarship[] = await Promise.all(
      swStarshipUrls.map(async (swStarshipUrl) => {
        const response =
          await this.cachedHttpService.get<StarWarsStarship>(swStarshipUrl);
        const {
          name,
          url,
          model,
          manufacturer,
          starship_class: vehicleClass,
        } = response.data;
        const mappedStarship: MappedStarship = {
          id: getLastParamFromUrl(url),
          name,
          model,
          manufacturer,
          vehicleClass,
        };
        return mappedStarship;
      }),
    );
    return mappedStarships;
  }

  private async getFilms({
    swFilmUrls,
  }: {
    swFilmUrls: string[];
  }): Promise<MappedFilm[]> {
    const mappedFilmms: MappedFilm[] = await Promise.all(
      swFilmUrls.map(async (swFilmUrl) => {
        const response =
          await this.cachedHttpService.get<StarWarsFilm>(swFilmUrl);
        const {
          director,
          producer,
          title,
          release_date: releaseDate,
        } = response.data;

        const mappedStarship: MappedFilm = {
          id: getLastParamFromUrl(swFilmUrl),
          director,
          producer,
          title,
          releaseDate,
        };
        return mappedStarship;
      }),
    );
    return mappedFilmms;
  }

  private getMappedPersonCachedKey(id: string): string {
    return `${MAPPED_PERSON_CACHE_KEY}:${id}`;
  }

  @TraceSpan()
  @AsyncMethodLogger({ logLevel: 'verbose', logMethodArgs: true, logMethodRetunValue: true })
  async getPersonById({ id }: { id: string }): Promise<MappedPerson> {
    const personFromCache = await this.cacheManagerService.get<MappedPerson>(this.getMappedPersonCachedKey(id));
    if (!isNil(personFromCache)) {
      return personFromCache;
    }
    const swApiPersonUrl = new URL(`people/${id}`, process.env.SW_API_BASE_URL);
    const response = await this.cachedHttpService.get<StarWarsPerson>(swApiPersonUrl.href);
    const [mappedPerson] = await this.mapPeople({ swPeople: [response.data] });
    return mappedPerson;
  }
}
