CREATE TABLE `user_business_alignments` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`business_id` integer NOT NULL,
	`liberal` real DEFAULT 0 NOT NULL,
	`conservative` real DEFAULT 0 NOT NULL,
	`libertarian` real DEFAULT 0 NOT NULL,
	`green` real DEFAULT 0 NOT NULL,
	`centrist` real DEFAULT 0 NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_business_alignments_user_id_business_id_unique` ON `user_business_alignments` (`user_id`,`business_id`);