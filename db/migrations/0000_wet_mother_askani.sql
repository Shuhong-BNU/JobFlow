CREATE TYPE "public"."ai_task_status" AS ENUM('queued', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_task_type" AS ENUM('parse_jd', 'suggest_next_step', 'interview_prep');--> statement-breakpoint
CREATE TYPE "public"."application_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."application_source" AS ENUM('official_site', 'referral', 'job_board', 'campus', 'headhunter', 'other');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('wishlist', 'applied', 'oa', 'interview', 'hr', 'offer', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('internship', 'full_time', 'part_time', 'contract', 'campus_program');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('deadline', 'oa', 'interview', 'offer_response', 'follow_up', 'reminder', 'task');--> statement-breakpoint
CREATE TYPE "public"."mail_provider" AS ENUM('gmail');--> statement-breakpoint
CREATE TYPE "public"."mail_type" AS ENUM('application_confirmation', 'oa_invite', 'interview_invite', 'rejection', 'offer', 'other');--> statement-breakpoint
CREATE TYPE "public"."material_purpose" AS ENUM('primary_resume', 'cover_letter', 'portfolio', 'supplementary');--> statement-breakpoint
CREATE TYPE "public"."material_type" AS ENUM('resume', 'cover_letter', 'portfolio', 'transcript', 'certificate', 'other');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('general', 'interview_feedback', 'follow_up', 'risk');--> statement-breakpoint
CREATE TYPE "public"."offer_decision_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TABLE "ai_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_type" "ai_task_type" NOT NULL,
	"input_payload" jsonb NOT NULL,
	"output_payload" jsonb,
	"status" "ai_task_status" DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"event_type" "event_type" NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"reminder_at" timestamp with time zone,
	"status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"purpose" "material_purpose" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"note_type" "note_type" DEFAULT 'general' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"department" varchar(160),
	"location" varchar(160),
	"source" "application_source" DEFAULT 'official_site' NOT NULL,
	"source_url" text,
	"employment_type" "employment_type" DEFAULT 'internship' NOT NULL,
	"deadline_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"current_status" "application_status" DEFAULT 'wishlist' NOT NULL,
	"priority" "application_priority" DEFAULT 'medium' NOT NULL,
	"salary_range" jsonb,
	"referral_name" varchar(120),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"website" text,
	"industry" varchar(120),
	"location" varchar(160),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "mail_provider" NOT NULL,
	"provider_account_email" varchar(255) NOT NULL,
	"access_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"message_id" varchar(255) NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"mail_type" "mail_type" NOT NULL,
	"subject" text NOT NULL,
	"sender" varchar(255) NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"extracted_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "material_type" NOT NULL,
	"name" varchar(180) NOT NULL,
	"file_url" text NOT NULL,
	"version" varchar(40) NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"base_salary" integer,
	"bonus" integer,
	"location" varchar(160),
	"team" varchar(160),
	"response_deadline_at" timestamp with time zone,
	"decision_status" "offer_decision_status" DEFAULT 'pending' NOT NULL,
	"pros" text,
	"cons" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120),
	"email" varchar(255) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_materials" ADD CONSTRAINT "application_materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_materials" ADD CONSTRAINT "application_materials_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_materials" ADD CONSTRAINT "application_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_connections" ADD CONSTRAINT "mail_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_events" ADD CONSTRAINT "mail_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_events" ADD CONSTRAINT "mail_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_events_app_idx" ON "application_events" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_events_user_start_idx" ON "application_events" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "application_materials_unique_key" ON "application_materials" USING btree ("application_id","material_id","purpose");--> statement-breakpoint
CREATE INDEX "application_notes_app_idx" ON "application_notes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "applications_user_status_idx" ON "applications" USING btree ("user_id","current_status");--> statement-breakpoint
CREATE INDEX "applications_user_deadline_idx" ON "applications" USING btree ("user_id","deadline_at");--> statement-breakpoint
CREATE INDEX "applications_company_idx" ON "applications" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_user_name_key" ON "companies" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "companies_user_id_idx" ON "companies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mail_events_user_received_idx" ON "mail_events" USING btree ("user_id","received_at");--> statement-breakpoint
CREATE INDEX "materials_user_id_idx" ON "materials" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offers_application_id_key" ON "offers" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_credentials_user_id_key" ON "user_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");