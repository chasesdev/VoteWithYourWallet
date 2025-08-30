// Type definitions for national business scraping
export interface StateConfig {
  state: string;
  tier: number;
  businessTarget: number;
  cities: string[];
  metropolitanAreas: string[];
  industries: string[];
}

export interface StateResult {
  state: string;
  tier: number;
  target: number;
  processed: number;
  success: number;
  failed: number;
  errors: string[];
}

export interface TierResult {
  tier: number;
  states: StateResult[];
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  totalTarget: number;
}

export interface ScrapingStats {
  totalBusinesses: number;
  byState: Array<{ state: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  successRate?: number;
  errorRate?: number;
  averageResponseTime?: number;
}

export interface BusinessData {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  isActive?: boolean;
  dataQuality?: number;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScrapingConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  rateLimitDelay: number;
  maxConcurrent: number;}