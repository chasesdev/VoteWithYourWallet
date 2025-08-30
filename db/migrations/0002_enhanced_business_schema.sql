-- Enhanced Business Schema Migration
-- This migration adds comprehensive business data fields and supporting tables

-- Add new columns to existing businesses table
ALTER TABLE businesses ADD COLUMN city TEXT;
ALTER TABLE businesses ADD COLUMN state TEXT;
ALTER TABLE businesses ADD COLUMN zip_code TEXT;
ALTER TABLE businesses ADD COLUMN county TEXT;
ALTER TABLE businesses ADD COLUMN neighborhood TEXT;
ALTER TABLE businesses ADD COLUMN phone TEXT;
ALTER TABLE businesses ADD COLUMN email TEXT;
ALTER TABLE businesses ADD COLUMN hours TEXT; -- JSON string for operating hours
ALTER TABLE businesses ADD COLUMN price_range TEXT; -- $, $$, $$$, $$$$
ALTER TABLE businesses ADD COLUMN year_founded INTEGER;
ALTER TABLE businesses ADD COLUMN employee_count INTEGER;
ALTER TABLE businesses ADD COLUMN business_size TEXT; -- small, medium, large
ALTER TABLE businesses ADD COLUMN logo_url TEXT;
ALTER TABLE businesses ADD COLUMN social_media TEXT; -- JSON string for social media links
ALTER TABLE businesses ADD COLUMN tags TEXT; -- JSON string for business tags
ALTER TABLE businesses ADD COLUMN attributes TEXT; -- JSON string for additional attributes
ALTER TABLE businesses ADD COLUMN data_source TEXT; -- Source of the business data
ALTER TABLE businesses ADD COLUMN data_quality INTEGER DEFAULT 5; -- 1-10 quality score
ALTER TABLE businesses ADD COLUMN is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1));
ALTER TABLE businesses ADD COLUMN is_verified INTEGER DEFAULT 0 CHECK (is_verified IN (0, 1));
ALTER TABLE businesses ADD COLUMN updated_at INTEGER DEFAULT (strftime('%s', 'now'));

-- Create business_categories table
CREATE TABLE business_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create business_tags table
CREATE TABLE business_tags (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create business_tag_relations table
CREATE TABLE business_tag_relations (
  id INTEGER PRIMARY KEY,
  business_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES business_tags(id) ON DELETE CASCADE
);

-- Create business_media table
CREATE TABLE business_media (
  id INTEGER PRIMARY KEY,
  business_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('logo', 'photo', 'cover')),
  url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  source TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Create business_reviews table
CREATE TABLE business_reviews (
  id INTEGER PRIMARY KEY,
  business_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add confidence column to business_alignments table
ALTER TABLE business_alignments ADD COLUMN confidence REAL DEFAULT 0;
ALTER TABLE business_alignments ADD COLUMN data_source TEXT;
ALTER TABLE business_alignments ADD COLUMN last_updated INTEGER DEFAULT (strftime('%s', 'now'));

-- Add year and source columns to donations table
ALTER TABLE donations ADD COLUMN year INTEGER;
ALTER TABLE donations ADD COLUMN source TEXT;

-- Create data_sources table
CREATE TABLE data_sources (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('api', 'scrape', 'manual', 'user')),
  url TEXT,
  api_key TEXT,
  rate_limit INTEGER, -- requests per hour
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  last_sync INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create sync_logs table
CREATE TABLE sync_logs (
  id INTEGER PRIMARY KEY,
  data_source_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  records_processed INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  duration INTEGER, -- in seconds
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_businesses_city_state ON businesses(city, state);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_data_source ON businesses(data_source);
CREATE INDEX idx_businesses_is_active ON businesses(is_active);
CREATE INDEX idx_business_tag_relations_business_id ON business_tag_relations(business_id);
CREATE INDEX idx_business_tag_relations_tag_id ON business_tag_relations(tag_id);
CREATE INDEX idx_business_media_business_id ON business_media(business_id);
CREATE INDEX idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX idx_business_reviews_user_id ON business_reviews(user_id);
CREATE INDEX idx_business_alignments_business_id ON business_alignments(business_id);
CREATE INDEX idx_donations_business_id ON donations(business_id);
CREATE INDEX idx_sync_logs_data_source_id ON sync_logs(data_source_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at);

-- Insert default business categories
INSERT INTO business_categories (name, description, icon, color) VALUES 
('Retail', 'Retail stores and shops', 'storefront', '#3B82F6'),
('Food & Dining', 'Restaurants, cafes, and food services', 'restaurant', '#EF4444'),
('Technology', 'Tech companies and services', 'laptop', '#8B5CF6'),
('Healthcare', 'Medical services and healthcare providers', 'medical', '#10B981'),
('Finance', 'Banks, financial services, and insurance', 'card', '#F59E0B'),
('Manufacturing', 'Manufacturing and production companies', 'construct', '#6B7280'),
('Energy', 'Energy companies and utilities', 'flash', '#F97316'),
('Transportation', 'Transportation and logistics companies', 'car', '#84CC16'),
('Entertainment', 'Entertainment and media companies', 'musical-notes', '#EC4899'),
('Education', 'Educational institutions and services', 'school', '#06B6D4'),
('Professional Services', 'Consulting, legal, and professional services', 'briefcase', '#6366F1'),
('Real Estate', 'Real estate agencies and property management', 'home', '#059669'),
('Automotive', 'Car dealerships and automotive services', 'car', '#DC2626'),
('Beauty & Personal Care', 'Salons, spas, and personal care services', 'person', '#BE185D'),
('Fitness & Recreation', 'Gyms, fitness centers, and recreational facilities', 'fitness', '#0891B2');

-- Insert default business tags
INSERT INTO business_tags (name, category) VALUES 
('Local Business', 'General'),
('Chain Store', 'General'),
('Family Owned', 'General'),
('Women Owned', 'General'),
('Minority Owned', 'General'),
('Veteran Owned', 'General'),
('Eco-Friendly', 'Values'),
('Sustainable', 'Values'),
('Organic', 'Values'),
('Fair Trade', 'Values'),
('B Corp', 'Values'),
('Non-Profit', 'Values'),
('LGBTQ+ Friendly', 'Values'),
('Wheelchair Accessible', 'Accessibility'),
('Pet Friendly', 'Services'),
('Free WiFi', 'Services'),
('Outdoor Seating', 'Services'),
('Delivery Available', 'Services'),
('Takeout Available', 'Services'),
('Parking Available', 'Services'),
('Open Late', 'Hours'),
('Weekend Hours', 'Hours');

-- Insert default data sources
INSERT INTO data_sources (name, type, url, rate_limit) VALUES 
('OpenStreetMap', 'api', 'https://api.openstreetmap.org', 1000),
('Wikipedia', 'scrape', 'https://en.wikipedia.org', 500),
('Yelp Fusion', 'api', 'https://api.yelp.com/v3', 5000),
('Google Places', 'api', 'https://maps.googleapis.com/maps/api/place', 1000),
('Government Registry', 'scrape', 'https://www.sec.gov', 200),
('Chamber of Commerce', 'scrape', 'https://www.uschamber.com', 300),
('User Contribution', 'user', NULL, NULL),
('Manual Entry', 'manual', NULL, NULL);