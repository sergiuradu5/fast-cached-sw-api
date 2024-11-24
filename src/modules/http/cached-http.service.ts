import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { parse, stringify } from 'flatted';
import { CacheManagerService } from '../cache/cache-manager.service';
import { CACHED_HTTP_REQUEST_COUNTER_KEY } from './constants';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  useCache?: boolean;
}

@Injectable()
export class CachedHttpService {
  private fetchCounter = 0;
  private readonly axiosInstance: AxiosInstance;
  private readonly logger: Logger = new Logger(CachedHttpService.name);

  constructor(private readonly cacheManagerService: CacheManagerService) {
    this.axiosInstance = axios.create();

    this.axiosInstance.interceptors.request.use((config) => {
      config['metadata'] = { ...config['metadata'], startDate: new Date() };
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const { config } = response;
        config['metadata'] = { ...config['metadata'], endDate: new Date() };
        const duration =
          config['metadata'].endDate.getTime() -
          config['metadata'].startDate.getTime();
        this.logger.log(
          `${config.method.toUpperCase()} ${config.url} ${duration}ms`,
        );
        this.fetchCounter++;
        return response;
      },
      (err) => {
        this.logger.error(err);
        return Promise.reject(err);
      },
    );
  }

  async get<T>(
    url: string,
    config: ExtendedAxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    const { useCache = true, ...restOfConfig } = config;
    if (useCache) {
      const cacheKey = this.getCachedHttpRequestKey('GET', url, restOfConfig);
      const cachedResponse =
        await this.cacheManagerService.get<string>(cacheKey);
      if (cachedResponse) {
        return parse(cachedResponse);
      }
      const response = await this.axiosInstance.get<T>(url, restOfConfig);
      await this.cacheManagerService.set(cacheKey, stringify(response));
      return response;
    }
    return this.axiosInstance.get<T>(url, restOfConfig);
  }

  async post<T>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response;
  }

  async patch<T>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response;
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response;
  }

  private getCachedHttpRequestKey(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
  ): string {
    return `${method}_${url}_${config ? JSON.stringify(config) : ''}`;
  }

  private getRequestCounterKey(
  ): string {
    return CACHED_HTTP_REQUEST_COUNTER_KEY;
  }

  public getFetchCounter(): number {
    return this.fetchCounter;
  }

  public async resetFetchCounter(): Promise<void> {
    const requestCounter = await this.cacheManagerService.get<number>(this.getRequestCounterKey());
    await this.cacheManagerService.set(this.getRequestCounterKey(), requestCounter + this.fetchCounter);
    this.fetchCounter = 0;
  }
}
