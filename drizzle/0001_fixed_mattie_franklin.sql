ALTER TABLE `consultation_leads` ADD `visitor` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `consultation_leads` ADD `payment_status` text DEFAULT 'UNPAID' NOT NULL;