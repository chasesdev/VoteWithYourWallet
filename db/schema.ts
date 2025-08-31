import { sqliteTable, integer, text, real, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false).notNull(),
  verificationToken: text('verification_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businesses = sqliteTable('businesses', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  website: text('website'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  county: text('county'),
  neighborhood: text('neighborhood'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  phone: text('phone'),
  email: text('email'),
  hours: text('hours'), // JSON string for operating hours
  priceRange: text('price_range'), // $, $$, $$$, $$$$
  yearFounded: integer('year_founded'),
  employeeCount: integer('employee_count'),
  businessSize: text('business_size'), // small, medium, large
  imageUrl: text('image_url'),
  logoUrl: text('logo_url'),
  socialMedia: text('social_media'), // JSON string for social media links
  tags: text('tags'), // JSON string for business tags
  attributes: text('attributes'), // JSON string for additional attributes
  dataSource: text('data_source'), // Source of the business data
  dataQuality: integer('data_quality'), // 1-10 quality score
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businessCategories = sqliteTable('business_categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businessTags = sqliteTable('business_tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  category: text('category'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businessTagRelations = sqliteTable('business_tag_relations', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  tagId: integer('tag_id').notNull().references(() => businessTags.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businessMedia = sqliteTable('business_media', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  type: text('type').notNull(), // 'logo', 'photo', 'cover'
  url: text('url').notNull(),
  originalUrl: text('original_url'),
  width: integer('width'),
  height: integer('height'),
  format: text('format'),
  size: integer('size'),
  caption: text('caption'),
  altText: text('alt_text'),
  source: text('source'), // Source of the image
  license: text('license'),
  attribution: text('attribution'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businessReviews = sqliteTable('business_reviews', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  userId: integer('user_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  helpfulCount: integer('helpful_count').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userAlignments = sqliteTable('user_alignments', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  liberal: real('liberal').default(0).notNull(),
  conservative: real('conservative').default(0).notNull(),
  libertarian: real('libertarian').default(0).notNull(),
  green: real('green').default(0).notNull(),
  centrist: real('centrist').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const businessAlignments = sqliteTable('business_alignments', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().unique().references(() => businesses.id),
  liberal: real('liberal').default(0).notNull(),
  conservative: real('conservative').default(0).notNull(),
  libertarian: real('libertarian').default(0).notNull(),
  green: real('green').default(0).notNull(),
  centrist: real('centrist').default(0).notNull(),
  confidence: real('confidence').default(0).notNull(), // 0-1 confidence score
  dataSource: text('data_source'), // Source of alignment data
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userBusinessAlignments = sqliteTable('user_business_alignments', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  liberal: real('liberal').default(0).notNull(),
  conservative: real('conservative').default(0).notNull(),
  libertarian: real('libertarian').default(0).notNull(),
  green: real('green').default(0).notNull(),
  centrist: real('centrist').default(0).notNull(),
  confidence: real('confidence').default(0.5).notNull(), // User confidence in their assessment
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userBusinessUnique: unique().on(table.userId, table.businessId),
}));

export const donations = sqliteTable('donations', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  organization: text('organization').notNull(),
  amount: integer('amount').notNull(),
  politicalLean: text('political_lean').notNull(),
  year: integer('year'),
  source: text('source'), // Source of donation data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  userId: integer('user_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const dataSources = sqliteTable('data_sources', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull(), // 'api', 'scrape', 'manual', 'user'
  url: text('url'),
  apiKey: text('api_key'),
  rateLimit: integer('rate_limit'), // requests per hour
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  lastSync: integer('last_sync', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const syncLogs = sqliteTable('sync_logs', {
  id: integer('id').primaryKey(),
  dataSourceId: integer('data_source_id').notNull().references(() => dataSources.id),
  status: text('status').notNull(), // 'success', 'failed', 'partial'
  recordsProcessed: integer('records_processed').default(0),
  recordsAdded: integer('records_added').default(0),
  recordsUpdated: integer('records_updated').default(0),
  recordsFailed: integer('records_failed').default(0),
  errorMessage: text('error_message'),
  duration: integer('duration'), // in seconds
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const politicalActivity = sqliteTable('political_activity', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  date: text('date').notNull(), // ISO date string (YYYY-MM-DD)
  type: text('type').notNull(), // 'donation', 'statement', 'endorsement', 'lobbying', 'lawsuit', 'sponsorship'
  title: text('title').notNull(),
  description: text('description').notNull(),
  amount: integer('amount'), // Amount in cents for donations/lobbying
  recipient: text('recipient'), // Recipient organization/candidate
  impact: text('impact').notNull(), // 'positive', 'negative', 'neutral'
  sourceUrl: text('source_url'), // Link to source documentation
  sourceType: text('source_type'), // 'news', 'fec', 'lobbying_disclosure', 'company_statement'
  confidence: real('confidence').default(0.8).notNull(), // 0-1 confidence score in data accuracy
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false).notNull(),
  tags: text('tags'), // JSON array of relevant tags
  metadata: text('metadata'), // JSON for additional structured data
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});