CREATE TABLE `cart_items` (
	`owner_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	PRIMARY KEY(`owner_id`, `product_id`),
	CONSTRAINT "cart_quantity_valid" CHECK("cart_items"."quantity" BETWEEN 1 AND 20)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`request_key` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`fulfilment` text NOT NULL,
	`address` text NOT NULL,
	`notes` text NOT NULL,
	`items` text NOT NULL,
	`subtotal_paise` integer NOT NULL,
	`shipping_paise` integer NOT NULL,
	`total_paise` integer NOT NULL,
	`status` text NOT NULL,
	`payment_status` text DEFAULT 'UNPAID' NOT NULL,
	`payment_mode` text NOT NULL,
	`inventory_state` text NOT NULL,
	`stripe_session` text,
	`checkout_url` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`tracking` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_unique` ON `orders` (`owner_id`,`request_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_unique` ON `orders` (`stripe_session`);--> statement-breakpoint
CREATE INDEX `orders_owner_created` ON `orders` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_expiration` ON `orders` (`inventory_state`,`expires_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`purity` text NOT NULL,
	`description` text NOT NULL,
	`image_url` text NOT NULL,
	`kind` text NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`overlay_url` text DEFAULT '' NOT NULL,
	`ar_scale` real DEFAULT 1 NOT NULL,
	`ar_offset` real DEFAULT 0.12 NOT NULL,
	`price_paise` integer DEFAULT 0 NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`price_status` text DEFAULT 'On request' NOT NULL,
	CONSTRAINT "product_inventory_valid" CHECK("__new_products"."stock">=0 AND "__new_products"."reserved">=0 AND "__new_products"."reserved"<="__new_products"."stock" AND "__new_products"."price_paise">=0)
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "category", "purity", "description", "image_url", "kind", "published", "overlay_url", "ar_scale", "ar_offset", "price_paise", "stock", "reserved", "price_status") SELECT "id", "name", "category", "purity", "description", "image_url", "kind", "published", "overlay_url", "ar_scale", "ar_offset", 0, 0, 0, "price_status" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
CREATE TRIGGER reserve_order BEFORE INSERT ON orders BEGIN
 SELECT CASE WHEN NEW.inventory_state!='RESERVED' OR json_array_length(NEW.items)<1 OR json_array_length(NEW.items)>50 THEN RAISE(ABORT,'Invalid order') END;
 SELECT CASE WHEN EXISTS(SELECT 1 FROM json_each(NEW.items) i LEFT JOIN products p ON p.id=json_extract(i.value,'$.id') WHERE p.id IS NULL OR p.published!=1 OR p.price_paise<=0 OR p.price_paise!=json_extract(i.value,'$.unit_price') OR json_extract(i.value,'$.quantity') NOT BETWEEN 1 AND 20 OR p.stock-p.reserved<json_extract(i.value,'$.quantity')) THEN RAISE(ABORT,'Availability changed') END;
 SELECT CASE WHEN NEW.subtotal_paise!=(SELECT sum(json_extract(value,'$.quantity')*json_extract(value,'$.unit_price')) FROM json_each(NEW.items)) OR NEW.total_paise!=NEW.subtotal_paise+NEW.shipping_paise THEN RAISE(ABORT,'Invalid total') END;
 UPDATE products SET reserved=reserved+(SELECT json_extract(value,'$.quantity') FROM json_each(NEW.items) WHERE json_extract(value,'$.id')=products.id) WHERE id IN(SELECT json_extract(value,'$.id') FROM json_each(NEW.items));
END;
--> statement-breakpoint
CREATE TRIGGER finish_order BEFORE UPDATE OF inventory_state ON orders WHEN OLD.inventory_state!=NEW.inventory_state BEGIN
 SELECT CASE WHEN OLD.inventory_state!='RESERVED' OR NEW.inventory_state NOT IN('COMMITTED','RELEASED') THEN RAISE(ABORT,'Invalid inventory transition') END;
 UPDATE products SET reserved=reserved-(SELECT json_extract(value,'$.quantity') FROM json_each(OLD.items) WHERE json_extract(value,'$.id')=products.id),stock=stock- CASE WHEN NEW.inventory_state='COMMITTED' THEN (SELECT json_extract(value,'$.quantity') FROM json_each(OLD.items) WHERE json_extract(value,'$.id')=products.id) ELSE 0 END WHERE id IN(SELECT json_extract(value,'$.id') FROM json_each(OLD.items));
END;
--> statement-breakpoint
CREATE TRIGGER protect_reserved_product BEFORE DELETE ON products WHEN OLD.reserved>0 BEGIN SELECT RAISE(ABORT,'This piece has reserved orders. Cancel or fulfil them before removal.'); END;
--> statement-breakpoint
CREATE TRIGGER protect_order_snapshot BEFORE UPDATE OF items,subtotal_paise,shipping_paise,total_paise,owner_id ON orders BEGIN SELECT RAISE(ABORT,'Order snapshots are immutable'); END;

