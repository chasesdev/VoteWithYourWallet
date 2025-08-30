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
  maxConcurrent: number;
}

// Tier execution interface for the national scraping script
export interface TierExecution {
  tier: number;
  name: string;
  states: string[];
  target: number;
  description: string;
}

// Search result interface
export interface SearchResult {
  url: string;
  title?: string;
  description?: string;
}

// Business detail interface
export interface BusinessDetail {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  description?: string;
}

// Scraping error interface
export interface ScrapingError {
  type: string;
  message: string;
  timestamp: Date;
  url?: string;
}

// Business validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Database business record
export interface DatabaseBusiness {
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