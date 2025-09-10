CREATE TABLE `scans` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`scan_type` varchar(50) NOT NULL,
	`resource` text NOT NULL,
	`status` varchar(50) NOT NULL,
	`result` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
