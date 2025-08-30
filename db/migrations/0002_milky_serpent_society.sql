CREATE TABLE `business_categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_categories_name_unique` ON `business_categories` (`name`);--> statement-breakpoint
CREATE TABLE `business_media` (
	`id` integer PRIMARY KEY NOT NULL,
	`business_id` integer NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`alt_text` text,
	`source` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `business_reviews` (
	`id` integer PRIMARY KEY NOT NULL,
	`business_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`helpful_count` integer DEFAULT 0,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `business_tag_relations` (
	`id` integer PRIMARY KEY NOT NULL,
	`business_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `business_tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `business_tags` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_tags_name_unique` ON `business_tags` (`name`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`url` text,
	`api_key` text,
	`rate_limit` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`last_sync` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_name_unique` ON `data_sources` (`name`);--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` integer PRIMARY KEY NOT NULL,
	`data_source_id` integer NOT NULL,
	`status` text NOT NULL,
	`records_processed` integer DEFAULT 0,
	`records_added` integer DEFAULT 0,
	`records_updated` integer DEFAULT 0,
	`records_failed` integer DEFAULT 0,
	`error_message` text,
	`duration` integer,
	`created_at` integer,
	FOREIGN KEY (`data_source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `business_alignments` ADD `confidence` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `business_alignments` ADD `data_source` text;--> statement-breakpoint
ALTER TABLE `business_alignments` ADD `last_updated` integer;--> statement-breakpoint
ALTER TABLE `businesses` ADD `city` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `state` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `zip_code` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `county` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `neighborhood` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `email` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `hours` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `price_range` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `year_founded` integer;--> statement-breakpoint
ALTER TABLE `businesses` ADD `employee_count` integer;--> statement-breakpoint
ALTER TABLE `businesses` ADD `business_size` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `logo_url` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `social_media` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `attributes` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `data_source` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `data_quality` integer;--> statement-breakpoint
ALTER TABLE `businesses` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `is_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE `donations` ADD `year` integer;--> statement-breakpoint
ALTER TABLE `donations` ADD `source` text;