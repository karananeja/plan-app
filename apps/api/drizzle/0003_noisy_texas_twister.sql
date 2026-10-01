CREATE TABLE `expense_group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`emoji` text NOT NULL,
	`colour` text NOT NULL,
	`currency` text NOT NULL,
	`created_by_id` text NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `group_member` (
	`group_id` text NOT NULL,
	`person_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`group_id`, `person_id`),
	FOREIGN KEY (`group_id`) REFERENCES `expense_group`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `group_member_person_idx` ON `group_member` (`person_id`);