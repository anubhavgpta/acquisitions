ALTER TABLE "user" ALTER COLUMN "name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" varchar(255) DEFAULT 'user' NOT NULL;