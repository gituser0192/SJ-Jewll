CREATE SCHEMA "sheochand";
--> statement-breakpoint
CREATE TABLE "sheochand"."cart_items" (
	"owner_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "cart_items_owner_id_product_id_pk" PRIMARY KEY("owner_id","product_id"),
	CONSTRAINT "cart_quantity_valid" CHECK ("sheochand"."cart_items"."quantity" BETWEEN 1 AND 20)
);
--> statement-breakpoint
CREATE TABLE "sheochand"."consultation_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor" text DEFAULT '' NOT NULL,
	"payment_status" text DEFAULT 'UNPAID' NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"interest" text NOT NULL,
	"pref_date" text,
	"message" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheochand"."orders" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"request_key" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"fulfilment" text NOT NULL,
	"address" text NOT NULL,
	"notes" text NOT NULL,
	"items" text NOT NULL,
	"subtotal_paise" bigint NOT NULL,
	"shipping_paise" bigint NOT NULL,
	"total_paise" bigint NOT NULL,
	"status" text NOT NULL,
	"payment_status" text DEFAULT 'UNPAID' NOT NULL,
	"payment_mode" text NOT NULL,
	"inventory_state" text NOT NULL,
	"stripe_session" text,
	"checkout_url" text,
	"expires_at" text NOT NULL,
	"created_at" text NOT NULL,
	"tracking" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheochand"."pedigrees" (
	"cert_code" text PRIMARY KEY NOT NULL,
	"item_name" text NOT NULL,
	"artisan" text NOT NULL,
	"purity_score" text NOT NULL,
	"mint_date" text NOT NULL,
	"alloy" text NOT NULL,
	"signature" text NOT NULL,
	"scan" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheochand"."products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"purity" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"kind" text NOT NULL,
	"published" integer DEFAULT 1 NOT NULL,
	"overlay_url" text DEFAULT '' NOT NULL,
	"ar_scale" double precision DEFAULT 1 NOT NULL,
	"ar_offset" double precision DEFAULT 0.12 NOT NULL,
	"price_paise" integer DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"price_status" text DEFAULT 'On request' NOT NULL,
	CONSTRAINT "product_inventory_valid" CHECK ("sheochand"."products"."stock">=0 AND "sheochand"."products"."reserved">=0 AND "sheochand"."products"."reserved"<="sheochand"."products"."stock" AND "sheochand"."products"."price_paise">=0)
);
--> statement-breakpoint
CREATE TABLE "sheochand"."bullion_rates" (
	"id" integer PRIMARY KEY NOT NULL,
	"gold22k" double precision NOT NULL,
	"silver925" double precision NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheochand"."settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sheochand"."wishlists" (
	"visitor" text PRIMARY KEY NOT NULL,
	"items" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "orders_request_unique" ON "sheochand"."orders" USING btree ("owner_id","request_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_stripe_unique" ON "sheochand"."orders" USING btree ("stripe_session");--> statement-breakpoint
CREATE INDEX "orders_owner_created" ON "sheochand"."orders" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_expiration" ON "sheochand"."orders" USING btree ("inventory_state","expires_at");--> statement-breakpoint
CREATE FUNCTION sheochand.reserve_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item jsonb; lines jsonb; qty integer; total bigint:=0; found_id text;
BEGIN
 lines:=NEW.items::jsonb;
 IF NEW.inventory_state<>'RESERVED' OR jsonb_typeof(lines)<>'array' OR jsonb_array_length(lines) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid order'; END IF;
 IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(lines))<>jsonb_array_length(lines) THEN RAISE EXCEPTION 'Duplicate order item'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(lines) ORDER BY value->>'id' LOOP
  qty:=(item->>'quantity')::integer;
  IF qty IS NULL OR qty NOT BETWEEN 1 AND 20 OR (item->>'unit_price')::bigint<=0 THEN RAISE EXCEPTION 'Invalid order item'; END IF;
  UPDATE sheochand.products SET reserved=reserved+qty WHERE id=item->>'id' AND published=1 AND price_paise=(item->>'unit_price')::bigint AND stock-reserved>=qty RETURNING id INTO found_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Availability changed'; END IF;
  total:=total+qty*(item->>'unit_price')::bigint;
 END LOOP;
 IF total<>NEW.subtotal_paise OR NEW.shipping_paise<0 OR NEW.total_paise<>total+NEW.shipping_paise THEN RAISE EXCEPTION 'Invalid total'; END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER reserve_order BEFORE INSERT ON sheochand.orders FOR EACH ROW EXECUTE FUNCTION sheochand.reserve_order();
--> statement-breakpoint
CREATE FUNCTION sheochand.finish_order() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE item jsonb; qty integer;
BEGIN
 IF OLD.inventory_state=NEW.inventory_state THEN RETURN NEW; END IF;
 IF OLD.inventory_state<>'RESERVED' OR NEW.inventory_state NOT IN('COMMITTED','RELEASED') THEN RAISE EXCEPTION 'Invalid inventory transition'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(OLD.items::jsonb) ORDER BY value->>'id' LOOP
  qty:=(item->>'quantity')::integer;
  UPDATE sheochand.products SET reserved=reserved-qty,stock=stock-CASE WHEN NEW.inventory_state='COMMITTED' THEN qty ELSE 0 END WHERE id=item->>'id';
  IF NOT FOUND THEN RAISE EXCEPTION 'Reserved product missing'; END IF;
 END LOOP;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER finish_order BEFORE UPDATE OF inventory_state ON sheochand.orders FOR EACH ROW EXECUTE FUNCTION sheochand.finish_order();
--> statement-breakpoint
CREATE FUNCTION sheochand.protect_reserved_product() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.reserved>0 THEN RAISE EXCEPTION 'This piece has reserved orders. Cancel or fulfil them before removal.'; END IF;
 RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER protect_reserved_product BEFORE DELETE ON sheochand.products FOR EACH ROW EXECUTE FUNCTION sheochand.protect_reserved_product();
--> statement-breakpoint
CREATE FUNCTION sheochand.protect_order_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Order snapshots are immutable'; END;
$$;
--> statement-breakpoint
CREATE TRIGGER protect_order_snapshot BEFORE UPDATE OF items,subtotal_paise,shipping_paise,total_paise,owner_id ON sheochand.orders FOR EACH ROW EXECUTE FUNCTION sheochand.protect_order_snapshot();
