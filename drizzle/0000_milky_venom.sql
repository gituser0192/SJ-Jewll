CREATE TABLE `consultation_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`interest` text NOT NULL,
	`pref_date` text,
	`message` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pedigrees` (
	`cert_code` text PRIMARY KEY NOT NULL,
	`item_name` text NOT NULL,
	`artisan` text NOT NULL,
	`purity_score` text NOT NULL,
	`mint_date` text NOT NULL,
	`alloy` text NOT NULL,
	`signature` text NOT NULL,
	`scan` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`purity` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`kind` text NOT NULL,
	`price_status` text DEFAULT 'On request' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bullion_rates` (
	`id` integer PRIMARY KEY NOT NULL,
	`gold22k` real NOT NULL,
	`silver925` real NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`visitor` text PRIMARY KEY NOT NULL,
	`items` text NOT NULL
);
