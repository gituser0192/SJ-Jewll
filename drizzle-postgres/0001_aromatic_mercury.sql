CREATE TABLE "sheochand"."login_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "login_events_kind_valid" CHECK ("sheochand"."login_events"."kind" IN ('signin','signup'))
);
--> statement-breakpoint
CREATE INDEX "login_events_user_created" ON "sheochand"."login_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "login_events_created" ON "sheochand"."login_events" USING btree ("created_at");
--> statement-breakpoint
INSERT INTO "sheochand"."settings" ("key","value") VALUES ('login_tracking_started_at',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')) ON CONFLICT ("key") DO NOTHING;
