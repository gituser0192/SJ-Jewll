ALTER TABLE `products` ADD `published` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `overlay_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `ar_scale` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `ar_offset` real DEFAULT 0.12 NOT NULL;