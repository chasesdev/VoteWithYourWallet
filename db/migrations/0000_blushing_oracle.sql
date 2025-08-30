CREATE TABLE `business_alignments` (
	`id` integer PRIMARY KEY NOT NULL,
	`business_id` integer NOT NULL,
	`liberal` real DEFAULT 0 NOT NULL,
	`conservative` real DEFAULT 0 NOT NULL,
	`libertarian` real DEFAULT 0 NOT NULL,
	`green` real DEFAULT 0 NOT NULL,
	`centrist` real DEFAULT 0 NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`website` text,
	`address` text,
	`latitude` real,
	`longitude` real,
	`image_url` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `donations` (
	`id` integer PRIMARY KEY NOT NULL,
	`business_id` integer NOT NULL,
	`organization` text NOT NULL,
	`amount` integer NOT NULL,
	`political_lean` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_alignments` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`liberal` real DEFAULT 0 NOT NULL,
	`conservative` real DEFAULT 0 NOT NULL,
	`libertarian` real DEFAULT 0 NOT NULL,
	`green` real DEFAULT 0 NOT NULL,
	`centrist` real DEFAULT 0 NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);