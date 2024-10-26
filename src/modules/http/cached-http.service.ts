import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { CacheManagerService } from '../cache/cache-manager.service';

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
      const cacheKey = this.getCacheKey('GET', url, restOfConfig);
      const cachedResponse =
        await this.cacheManagerService.get<AxiosResponse<T>>(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
      const response = await this.axiosInstance.get<T>(url, restOfConfig);
      await this.cacheManagerService.set(cacheKey, response);
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

  private getCacheKey(
    method: string,
    url: string,
    config?: AxiosRequestConfig,
  ): string {
    return `${method}_${url}_${config ? JSON.stringify(config) : ''}`;
  }

  public getFetchCounter(): number {
    return this.fetchCounter;
  }

  public resetFetchCounter(): void {
    this.fetchCounter = 0;
  }
}
