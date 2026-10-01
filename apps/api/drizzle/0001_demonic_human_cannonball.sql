CREATE TABLE `friendship` (
	`person_id` text NOT NULL,
	`friend_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`person_id`, `friend_id`),
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`friend_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
