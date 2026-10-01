CREATE TABLE `expense` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`date` text NOT NULL,
	`currency` text NOT NULL,
	`total_minor` integer NOT NULL,
	`payer_id` text NOT NULL,
	`method` text NOT NULL,
	`note` text,
	`created_by_id` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `expense_group`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payer_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expense_group_idx` ON `expense` (`group_id`);--> statement-breakpoint
CREATE TABLE `expense_participant` (
	`expense_id` text NOT NULL,
	`person_id` text NOT NULL,
	`position` integer NOT NULL,
	`input` integer,
	`share_minor` integer NOT NULL,
	PRIMARY KEY(`expense_id`, `person_id`),
	FOREIGN KEY (`expense_id`) REFERENCES `expense`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `expense_participant_person_idx` ON `expense_participant` (`person_id`);