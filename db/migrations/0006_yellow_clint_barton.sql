ALTER TABLE `business_media` ADD `original_url` text;--> statement-breakpoint
ALTER TABLE `business_media` ADD `width` integer;--> statement-breakpoint
ALTER TABLE `business_media` ADD `height` integer;--> statement-breakpoint
ALTER TABLE `business_media` ADD `format` text;--> statement-breakpoint
ALTER TABLE `business_media` ADD `size` integer;--> statement-breakpoint
ALTER TABLE `business_media` ADD `license` text;--> statement-breakpoint
ALTER TABLE `business_media` ADD `attribution` text;--> statement-breakpoint
ALTER TABLE `business_media` ADD `is_primary` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_alignments` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `user_business_alignments` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `reset_token`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `reset_token_expiry`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `updated_at`;