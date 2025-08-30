import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const businesses = sqliteTable('businesses', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  website: text('website'),
  address: text('address'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
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
  businessId: integer('business_id').notNull().references(() => businesses.id),
  liberal: real('liberal').default(0).notNull(),
  conservative: real('conservative').default(0).notNull(),
  libertarian: real('libertarian').default(0).notNull(),
  green: real('green').default(0).notNull(),
  centrist: real('centrist').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const donations = sqliteTable('donations', {
  id: integer('id').primaryKey(),
  businessId: integer('business_id').notNull().references(() => businesses.id),
  organization: text('organization').notNull(),
  amount: integer('amount').notNull(),
  politicalLean: text('political_lean').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});