// Constants for categorization service

// Predefined business categories
export const PREDEFINED_CATEGORIES = [
  {
    name: 'Food & Dining',
    description: 'Restaurants, cafes, bars, and food services',
    icon: 'restaurant',
    color: '#FF6B6B',
    isActive: true
  },
  {
    name: 'Retail',
    description: 'Shopping stores, malls, and retail services',
    icon: 'storefront',
    color: '#4ECDC4',
    isActive: true
  },
  {
    name: 'Healthcare',
    description: 'Hospitals, clinics, pharmacies, and medical services',
    icon: 'medical',
    color: '#45B7D1',
    isActive: true
  },
  {
    name: 'Professional Services',
    description: 'Legal, financial, consulting, and business services',
    icon: 'briefcase',
    color: '#96CEB4',
    isActive: true
  },
  {
    name: 'Entertainment',
    description: 'Movies, theaters, music venues, and entertainment services',
    icon: 'musical-notes',
    color: '#FECA57',
    isActive: true
  },
  {
    name: 'Education',
    description: 'Schools, universities, training centers, and educational services',
    icon: 'school',
    color: '#FF9FF3',
    isActive: true
  },
  {
    name: 'Travel & Tourism',
    description: 'Hotels, travel agencies, tourist attractions, and transportation',
    icon: 'airplane',
    color: '#54A0FF',
    isActive: true
  },
  {
    name: 'Automotive',
    description: 'Car dealerships, repair shops, and automotive services',
    icon: 'car',
    color: '#48DBFB',
    isActive: true
  },
  {
    name: 'Real Estate',
    description: 'Property management, real estate agencies, and housing services',
    icon: 'home',
    color: '#1DD1A1',
    isActive: true
  },
  {
    name: 'Technology',
    description: 'Software companies, IT services, and technology providers',
    icon: 'laptop',
    color: '#5F27CD',
    isActive: true
  },
  {
    name: 'Fitness & Wellness',
    description: 'Gyms, spas, yoga studios, and wellness services',
    icon: 'fitness',
    color: '#00D2D3',
    isActive: true
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Salons, barbershops, spas, and personal care services',
    icon: 'person',
    color: '#FF6B9D',
    isActive: true
  },
  {
    name: 'Home Services',
    description: 'Plumbing, electrical, cleaning, and home maintenance services',
    icon: 'construct',
    color: '#C44569',
    isActive: true
  },
  {
    name: 'Financial Services',
    description: 'Banks, credit unions, investment services, and financial planning',
    icon: 'card',
    color: '#F8B500',
    isActive: true
  },
  {
    name: 'Government & Public Services',
    description: 'Government offices, public services, and municipal services',
    icon: 'business',
    color: '#6C5CE7',
    isActive: true
  },
  {
    name: 'Non-profit & Organizations',
    description: 'Charities, non-profits, and community organizations',
    icon: 'heart',
    color: '#A29BFE',
    isActive: true
  },
  {
    name: 'Manufacturing & Industrial',
    description: 'Factories, warehouses, and industrial services',
    icon: 'hammer',
    color: '#636E72',
    isActive: true
  },
  {
    name: 'Agriculture',
    description: 'Farms, agricultural services, and food production',
    icon: 'leaf',
    color: '#00B894',
    isActive: true
  },
  {
    name: 'Media & Publishing',
    description: 'Newspapers, magazines, broadcasting, and media services',
    icon: 'newspaper',
    color: '#E17055',
    isActive: true
  },
  {
    name: 'Legal Services',
    description: 'Law firms, legal consulting, and legal services',
    icon: 'document-text',
    color: '#2D3436',
    isActive: true
  }
];

// Predefined tags
export const PREDEFINED_TAGS = [
  // General tags
  { name: 'family-friendly', description: 'Suitable for families with children', category: 'general', isActive: true },
  { name: 'pet-friendly', description: 'Allows pets on premises', category: 'general', isActive: true },
  { name: 'wheelchair-accessible', description: 'Accessible for wheelchair users', category: 'general', isActive: true },
  { name: 'outdoor-seating', description: 'Has outdoor seating available', category: 'general', isActive: true },
  { name: 'wifi', description: 'Free WiFi available', category: 'general', isActive: true },
  { name: 'parking', description: 'Parking available', category: 'general', isActive: true },
  { name: 'delivery', description: 'Offers delivery service', category: 'general', isActive: true },
  { name: 'takeout', description: 'Offers takeout service', category: 'general', isActive: true },
  { name: 'reservation', description: 'Accepts reservations', category: 'general', isActive: true },
  { name: 'credit-card', description: 'Accepts credit cards', category: 'general', isActive: true },
  
  // Price range tags
  { name: 'budget-friendly', description: 'Affordable prices', category: 'price', isActive: true },
  { name: 'mid-range', description: 'Moderate prices', category: 'price', isActive: true },
  { name: 'upscale', description: 'Higher-end pricing', category: 'price', isActive: true },
  { name: 'luxury', description: 'Luxury experience and pricing', category: 'price', isActive: true },
  
  // Hours tags
  { name: '24-hours', description: 'Open 24 hours', category: 'hours', isActive: true },
  { name: 'late-night', description: 'Open late at night', category: 'hours', isActive: true },
  { name: 'early-morning', description: 'Open early in the morning', category: 'hours', isActive: true },
  { name: 'weekends', description: 'Open on weekends', category: 'hours', isActive: true },
  
  // Service tags
  { name: 'curbside-pickup', description: 'Offers curbside pickup', category: 'service', isActive: true },
  { name: 'drive-thru', description: 'Has drive-thru service', category: 'service', isActive: true },
  { name: 'online-ordering', description: 'Accepts online orders', category: 'service', isActive: true },
  { name: 'appointment-only', description: 'Requires appointments', category: 'service', isActive: true },
  { name: 'walk-ins-welcome', description: 'Accepts walk-in customers', category: 'service', isActive: true },
  
  // Atmosphere tags
  { name: 'casual', description: 'Casual atmosphere', category: 'atmosphere', isActive: true },
  { name: 'formal', description: 'Formal atmosphere', category: 'atmosphere', isActive: true },
  { name: 'romantic', description: 'Romantic atmosphere', category: 'atmosphere', isActive: true },
  { name: 'trendy', description: 'Trendy and modern atmosphere', category: 'atmosphere', isActive: true },
  { name: 'historic', description: 'Historic location or building', category: 'atmosphere', isActive: true },
  
  // Special features
  { name: 'outdoor-activities', description: 'Offers outdoor activities', category: 'features', isActive: true },
  { name: 'live-music', description: 'Features live music', category: 'features', isActive: true },
  { name: 'happy-hour', description: 'Offers happy hour specials', category: 'features', isActive: true },
  { name: 'kids-menu', description: 'Has kids menu', category: 'features', isActive: true },
  { name: 'vegan-options', description: 'Offers vegan options', category: 'features', isActive: true },
  { name: 'gluten-free', description: 'Offers gluten-free options', category: 'features', isActive: true },
  { name: 'organic', description: 'Uses organic ingredients/products', category: 'features', isActive: true },
  { name: 'local', description: 'Locally owned or uses local products', category: 'features', isActive: true },
  { name: 'sustainable', description: 'Environmentally sustainable practices', category: 'features', isActive: true },
  { name: 'award-winning', description: 'Has received awards or recognition', category: 'features', isActive: true }
];

// Default categorization configuration
export const DEFAULT_CATEGORIZATION_CONFIG = {
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  minConfidence: 50,
  maxSecondaryCategories: 3,
  maxTags: 10,
  enableAutoCategorization: true,
  autoCategorizationBatchSize: 100
};

// Categorization scoring weights
export const CATEGORIZATION_WEIGHTS = {
  directMatch: 100,
  keywordMatch: 10,
  partialMatch: 50,
  maxScore: 1000
};

// Database table names
export const DB_TABLES = {
  businesses: 'businesses',
  businessCategories: 'business_categories',
  businessTags: 'business_tags',
  businessTagRelations: 'business_tag_relations'
} as const;

// Category scoring thresholds
export const SCORING_THRESHOLDS = {
  primaryCategory: 0,
  secondaryCategory: 20,
  relevantTag: 5
};

// Cache keys
export const CACHE_KEYS = {
  allCategories: 'all_categories',
  allTags: 'all_tags',
  categorizeBusiness: 'categorize_',
  categorizationStats: 'categorization_stats'
};