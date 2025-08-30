// Types for business data processing
export interface BusinessData {
  name: string;
  description?: string;
  category: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  hours?: string;
  priceRange?: string;
  yearFounded?: number;
  employeeCount?: number;
  businessSize?: string;
  imageUrl?: string;
  logoUrl?: string;
  socialMedia?: Record<string, string | undefined>;
  tags?: string[];
  attributes?: Record<string, any>;
  dataSource: string;
  dataQuality?: number;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  duration: number;
}

export interface BusinessValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData?: BusinessData;
}