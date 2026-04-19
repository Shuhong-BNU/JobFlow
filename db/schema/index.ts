import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  aiTaskStatuses,
  aiTaskTypes,
  applicationPriorities,
  applicationSources,
  applicationStatuses,
  employmentTypes,
  eventStatuses,
  eventTypes,
  mailProviders,
  mailTypes,
  materialPurposes,
  materialTypes,
  noteTypes,
  offerDecisionStatuses,
} from "@/lib/constants";

export const applicationStatusEnum = pgEnum("application_status", applicationStatuses);
export const applicationPriorityEnum = pgEnum(
  "application_priority",
  applicationPriorities,
);
export const employmentTypeEnum = pgEnum("employment_type", employmentTypes);
export const applicationSourceEnum = pgEnum("application_source", applicationSources);
export const eventTypeEnum = pgEnum("event_type", eventTypes);
export const eventStatusEnum = pgEnum("event_status", eventStatuses);
export const materialTypeEnum = pgEnum("material_type", materialTypes);
export const materialPurposeEnum = pgEnum("material_purpose", materialPurposes);
export const noteTypeEnum = pgEnum("note_type", noteTypes);
export const offerDecisionStatusEnum = pgEnum(
  "offer_decision_status",
  offerDecisionStatuses,
);
export const mailProviderEnum = pgEnum("mail_provider", mailProviders);
export const mailTypeEnum = pgEnum("mail_type", mailTypes);
export const aiTaskTypeEnum = pgEnum("ai_task_type", aiTaskTypes);
export const aiTaskStatusEnum = pgEnum("ai_task_status", aiTaskStatuses);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }),
    email: varchar("email", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_key").on(table.email)],
);

export const userCredentials = pgTable(
  "user_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_credentials_user_id_key").on(table.userId)],
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    website: text("website"),
    industry: varchar("industry", { length: 120 }),
    location: varchar("location", { length: 160 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("companies_user_name_key").on(table.userId, table.name),
    index("companies_user_id_idx").on(table.userId),
  ],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    department: varchar("department", { length: 160 }),
    location: varchar("location", { length: 160 }),
    source: applicationSourceEnum("source").notNull().default("official_site"),
    sourceUrl: text("source_url"),
    employmentType: employmentTypeEnum("employment_type")
      .notNull()
      .default("internship"),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    currentStatus: applicationStatusEnum("current_status")
      .notNull()
      .default("wishlist"),
    priority: applicationPriorityEnum("priority").notNull().default("medium"),
    salaryRange: jsonb("salary_range").$type<{
      min?: number;
      max?: number;
      currency?: string;
      period?: "monthly" | "yearly";
    }>(),
    referralName: varchar("referral_name", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("applications_user_status_idx").on(table.userId, table.currentStatus),
    index("applications_user_deadline_idx").on(table.userId, table.deadlineAt),
    index("applications_company_idx").on(table.companyId),
  ],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    eventType: eventTypeEnum("event_type").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    status: eventStatusEnum("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("application_events_app_idx").on(table.applicationId),
    index("application_events_user_start_idx").on(table.userId, table.startsAt),
  ],
);

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: materialTypeEnum("type").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    fileUrl: text("file_url").notNull(),
    version: varchar("version", { length: 40 }).notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("materials_user_id_idx").on(table.userId)],
);

export const applicationMaterials = pgTable(
  "application_materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    purpose: materialPurposeEnum("purpose").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("application_materials_unique_key").on(
      table.applicationId,
      table.materialId,
      table.purpose,
    ),
  ],
);

export const applicationNotes = pgTable(
  "application_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    noteType: noteTypeEnum("note_type").notNull().default("general"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("application_notes_app_idx").on(table.applicationId)],
);

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    baseSalary: integer("base_salary"),
    bonus: integer("bonus"),
    location: varchar("location", { length: 160 }),
    team: varchar("team", { length: 160 }),
    responseDeadlineAt: timestamp("response_deadline_at", { withTimezone: true }),
    decisionStatus: offerDecisionStatusEnum("decision_status")
      .notNull()
      .default("pending"),
    pros: text("pros"),
    cons: text("cons"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("offers_application_id_key").on(table.applicationId)],
);

export const mailConnections = pgTable("mail_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: mailProviderEnum("provider").notNull(),
  providerAccountEmail: varchar("provider_account_email", { length: 255 }).notNull(),
  accessMetadata: jsonb("access_metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mailEvents = pgTable(
  "mail_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    messageId: varchar("message_id", { length: 255 }).notNull(),
    threadId: varchar("thread_id", { length: 255 }).notNull(),
    mailType: mailTypeEnum("mail_type").notNull(),
    subject: text("subject").notNull(),
    sender: varchar("sender", { length: 255 }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    extractedPayload: jsonb("extracted_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("mail_events_user_received_idx").on(table.userId, table.receivedAt)],
);

export const aiTasks = pgTable("ai_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskType: aiTaskTypeEnum("task_type").notNull(),
  inputPayload: jsonb("input_payload").notNull(),
  outputPayload: jsonb("output_payload"),
  status: aiTaskStatusEnum("status").notNull().default("queued"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
