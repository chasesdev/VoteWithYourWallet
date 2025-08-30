// Scraping utility types

export interface ScrapingConfig {
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  rateLimitDelay?: number;
  maxConcurrent?: number;
}

export interface HttpClientConfig {
  timeout?: number;
  headers?: Record<string, string>;
  userAgent?: string;
}

export interface SearchEngineConfig {
  name: string;
  baseUrl: string;
  searchParam: string;
  rateLimit?: number;
}

export interface BusinessDirectoryConfig {
  name: string;
  baseUrl: string;
  searchParam: string;
  locationParam: string;
  rateLimit?: number;
}
