// Types specific to categorization service
export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  businessCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  businessCount?: number;
}

export interface BusinessCategory {
  businessId: number;
  categoryId: number;
  isPrimary: boolean;
  confidence: number;
}

export interface BusinessTag {
  businessId: number;
  tagId: number;
  relevance: number;
  source: 'auto' | 'user' | 'admin';
}

export interface Attribute {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description?: string;
}

export interface CategorizationResult {
  businessId: number;
  primaryCategory: Category;
  secondaryCategories: Category[];
  tags: Tag[];
  attributes: Attribute[];
  confidence: number;
}

export interface CategorizationConfig {
  cacheEnabled: boolean;
  cacheTTL: number;
  minConfidence: number;
  maxSecondaryCategories: number;
  maxTags: number;
  enableAutoCategorization: boolean;
  autoCategorizationBatchSize: number;
  autoCategorize?: boolean;
  enableUserInput?: boolean;
}

export interface CategorizationStats {
  totalBusinesses: number;
  businessesWithCategories: number;
  businessesWithTags: number;
  categoryCoverage: number;
  tagCoverage: number;
  totalCategories: number;
  totalTags: number;
  topCategories: Category[];
  topTags: Tag[];
  error?: string;
}