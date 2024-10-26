import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNil } from 'lodash';
import { CacheManagerService } from 'src/modules/cache/cache-manager.service';
import { arrayFromRange } from 'src/modules/common/utils/array-from-range';
import { standardizeUrl } from 'src/modules/common/utils/standardize-url';
import { CachedHttpService } from 'src/modules/http/cached-http.service';
import { MAPPED_PERSON_CACHE_KEY } from '../constants/mapped-person-cache-keys.constants';
import { ApiResponse } from '../interfaces/api-response.interface';
import { MappedFilm } from '../interfaces/mapped-film.interface';
import { MappedPerson } from '../interfaces/mapped-person.interface';
import { MappedStarship } from '../interfaces/mapped-starship.interface';
import { StarWarsFilm } from '../interfaces/star-wars-film.interface';
import { StarWarsStarship } from '../interfaces/star-wars-starship.interface';
import { StarWarsPerson } from './../interfaces/star-wars-person.interface';

const SW_API_BASE_URL = 'https://swapi.dev/api/people/';
const ROBOHASH_API_BASE_URL = 'https://robohash.org/';
@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(
    private cacheManagerService: CacheManagerService,
    private readonly cachedHttpService: CachedHttpService,
  ) { }

  async getPeople({ search }: { search?: string }): Promise<MappedPerson[]> {
    const swApiFirstPageUrl = new URL(SW_API_BASE_URL);
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
        const swApiCurrentPageUrl = new URL(SW_API_BASE_URL);
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
    this.cachedHttpService.resetFetchCounter();
    return mappedPeople;
  }

  private async mapPeople({
    swPeople,
  }: {
    swPeople: StarWarsPerson[];
  }): Promise<MappedPerson[]> {
    const mappedPeople = await Promise.all(
      swPeople.map(async (swPerson) => {
        const id = this.getIdFromUrl(swPerson.url);
        const cacheKey = this.getMappedPersonCachedKey(id);
        const mappedPersonFromCache =
          await this.cacheManagerService.get<MappedPerson>(cacheKey);
        if (!isNil(mappedPersonFromCache)) {
          return mappedPersonFromCache;
        }
        const { data: arrayBuffer } = await this.cachedHttpService.get<string>(
          `${ROBOHASH_API_BASE_URL}/${id}`,
          {
            useCache: false, // NOTE: for images, we don't want to use cache, since every image is unique to each person
            responseType: 'arraybuffer',
          },
        );
        const base64Image = Buffer.from(arrayBuffer)
          .toString('base64')
          .slice(0, 10); //NOTE: take first 10 characters to make response more readable

        const starships: MappedStarship[] = await this.getStarships({
          swStarshipUrls: swPerson.starships,
        });

        // NOTE: Also added films in order to showcase modularity of existing code
        // const films: MappedFilm[] = await this.getFilms({ swFilmUrls: swPerson.films });

        const { name, height, mass, gender } = swPerson;

        const mappedPerson: MappedPerson = {
          id,
          name,
          height,
          mass,
          gender,
          starships,
          // films,
          image: base64Image,
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
          id: this.getIdFromUrl(url),
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
          id: this.getIdFromUrl(swFilmUrl),
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

  private getIdFromUrl(url: string): string {
    return standardizeUrl(url).split('/').pop();
  }
}
