CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`actor_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`group_id` text,
	`data` text,
	`occurred_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_occurred_at_idx` ON `activity` (`occurred_at`);--> statement-breakpoint
CREATE TABLE `activity_audience` (
	`activity_id` text NOT NULL,
	`person_id` text NOT NULL,
	PRIMARY KEY(`activity_id`, `person_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activity`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_audience_person_idx` ON `activity_audience` (`person_id`);