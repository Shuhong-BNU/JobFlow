import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  AI_TASK_STATUSES,
  AI_TASK_TYPES,
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EVENT_STATUSES,
  EVENT_TYPES,
  MAIL_TYPES,
  MATERIAL_TYPES,
  NOTE_TYPES,
  OFFER_DECISIONS,
  PRIORITIES,
} from '@/lib/enums';

// --- Enum types (Postgres) -------------------------------------------------

export const applicationStatusEnum = pgEnum('application_status', APPLICATION_STATUSES);
export const priorityEnum = pgEnum('priority', PRIORITIES);
export const employmentTypeEnum = pgEnum('employment_type', EMPLOYMENT_TYPES);
export const eventTypeEnum = pgEnum('event_type', EVENT_TYPES);
export const eventStatusEnum = pgEnum('event_status', EVENT_STATUSES);
export const noteTypeEnum = pgEnum('note_type', NOTE_TYPES);
export const materialTypeEnum = pgEnum('material_type', MATERIAL_TYPES);
export const offerDecisionEnum = pgEnum('offer_decision', OFFER_DECISIONS);
export const mailTypeEnum = pgEnum('mail_type', MAIL_TYPES);
export const aiTaskTypeEnum = pgEnum('ai_task_type', AI_TASK_TYPES);
export const aiTaskStatusEnum = pgEnum('ai_task_status', AI_TASK_STATUSES);

// --- Auth (NextAuth + DrizzleAdapter compatible) ---------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('avatar_url'),
  /** Argon2/bcrypt hash; null for OAuth-only users (future). */
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) })
);

// --- Core domain (Phase 1) -------------------------------------------------

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    website: text('website'),
    industry: text('industry'),
    location: text('location'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userNameIdx: index('companies_user_name_idx').on(t.userId, t.name),
  })
);

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    department: text('department'),
    location: text('location'),
    source: text('source'),
    sourceUrl: text('source_url'),
    employmentType: employmentTypeEnum('employment_type').notNull().default('fulltime'),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    currentStatus: applicationStatusEnum('current_status').notNull().default('wishlist'),
    priority: priorityEnum('priority').notNull().default('medium'),
    salaryRange: text('salary_range'),
    referralName: text('referral_name'),
    notes: text('notes'),
    /** Position within its kanban column. Lower = top. */
    boardOrder: integer('board_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('applications_user_status_order_idx').on(
      t.userId,
      t.currentStatus,
      t.boardOrder
    ),
    deadlineIdx: index('applications_user_deadline_idx').on(t.userId, t.deadlineAt),
  })
);

export const applicationEvents = pgTable(
  'application_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    eventType: eventTypeEnum('event_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    reminderAt: timestamp('reminder_at', { withTimezone: true }),
    status: eventStatusEnum('status').notNull().default('scheduled'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    appStartsIdx: index('application_events_app_starts_idx').on(t.applicationId, t.startsAt),
  })
);

export const applicationNotes = pgTable('application_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  noteType: noteTypeEnum('note_type').notNull().default('general'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Phase 2 placeholders (built early to avoid future schema churn) -------
// They are created so naming + foreign keys are frozen, but Phase 1 UI does
// not write to them. Materials upload UI is enabled in Phase 2.

export const materials = pgTable(
  'materials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: materialTypeEnum('type').notNull(),
    name: text('name').notNull(),
    fileUrl: text('file_url'),
    version: text('version'),
    tags: jsonb('tags').$type<string[]>().default([]),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userTypeIdx: index('materials_user_type_idx').on(t.userId, t.type) })
);

export const applicationMaterials = pgTable(
  'application_materials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    materialId: uuid('material_id')
      .notNull()
      .references(() => materials.id, { onDelete: 'cascade' }),
    purpose: text('purpose'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('application_materials_unique_idx').on(
      t.applicationId,
      t.materialId,
      t.purpose
    ),
  })
);

export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .unique()
    .references(() => applications.id, { onDelete: 'cascade' }),
  baseSalary: text('base_salary'),
  bonus: text('bonus'),
  location: text('location'),
  team: text('team'),
  responseDeadlineAt: timestamp('response_deadline_at', { withTimezone: true }),
  decisionStatus: offerDecisionEnum('decision_status').notNull().default('pending'),
  pros: text('pros'),
  cons: text('cons'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Phase 3/4 placeholders ------------------------------------------------

export const mailConnections = pgTable('mail_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountEmail: text('provider_account_email').notNull(),
  accessMetadata: jsonb('access_metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mailEvents = pgTable(
  'mail_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    messageId: text('message_id').notNull(),
    threadId: text('thread_id'),
    mailType: mailTypeEnum('mail_type').notNull().default('unknown'),
    subject: text('subject'),
    sender: text('sender'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    extractedPayload: jsonb('extracted_payload').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userReceivedIdx: index('mail_events_user_received_idx').on(t.userId, t.receivedAt) })
);

export const aiTasks = pgTable('ai_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskType: aiTaskTypeEnum('task_type').notNull(),
  inputPayload: jsonb('input_payload').$type<Record<string, unknown>>(),
  outputPayload: jsonb('output_payload').$type<Record<string, unknown>>(),
  status: aiTaskStatusEnum('status').notNull().default('pending'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Inferred row types ---------------------------------------------------

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationEvent = typeof applicationEvents.$inferSelect;
export type ApplicationNote = typeof applicationNotes.$inferSelect;

// silence unused linter for placeholder enum
void boolean;
void sql;
