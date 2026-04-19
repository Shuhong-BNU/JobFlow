import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { addDays, subDays } from 'date-fns';
import * as schema from './schema';
import type { ApplicationStatus, Priority } from '@/lib/enums';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log('Seeding…');

  // 1. Demo user
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const [user] = await db
    .insert(schema.users)
    .values({
      name: 'Demo Student',
      email: 'demo@jobflow.local',
      passwordHash,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { name: 'Demo Student', passwordHash },
    })
    .returning();
  if (!user) throw new Error('failed to upsert demo user');
  console.log('  user:', user.email);

  // Wipe this user's existing demo data so reruns are idempotent.
  // (events/notes cascade via FK on applications.)
  await client`delete from applications where user_id = ${user.id}`;
  await client`delete from companies where user_id = ${user.id}`;

  // 2. Companies
  const companyRows = await db
    .insert(schema.companies)
    .values([
      { userId: user.id, name: 'Stripe', industry: 'Fintech', location: 'Remote' },
      { userId: user.id, name: 'Linear', industry: 'Productivity', location: 'Remote' },
      { userId: user.id, name: 'Figma', industry: 'Design Tools', location: 'San Francisco, CA' },
      { userId: user.id, name: 'Vercel', industry: 'DevTools', location: 'Remote' },
      { userId: user.id, name: 'Anthropic', industry: 'AI', location: 'San Francisco, CA' },
    ])
    .returning();

  const byName = Object.fromEntries(companyRows.map((c) => [c.name, c]));

  // 3. Applications across all 8 statuses
  const now = new Date();
  type Seed = {
    company: keyof typeof byName;
    title: string;
    status: ApplicationStatus;
    priority: Priority;
    deadlineOffset: number | null;
    appliedOffset: number | null;
    boardOrder: number;
  };
  const seeds: Seed[] = [
    { company: 'Stripe', title: 'Software Engineer Intern', status: 'wishlist', priority: 'high', deadlineOffset: 14, appliedOffset: null, boardOrder: 0 },
    { company: 'Anthropic', title: 'AI Research Engineer', status: 'wishlist', priority: 'high', deadlineOffset: 21, appliedOffset: null, boardOrder: 1 },
    { company: 'Linear', title: 'Frontend Engineer', status: 'applied', priority: 'medium', deadlineOffset: 7, appliedOffset: -2, boardOrder: 0 },
    { company: 'Figma', title: 'Product Designer Intern', status: 'applied', priority: 'medium', deadlineOffset: 5, appliedOffset: -3, boardOrder: 1 },
    { company: 'Vercel', title: 'Developer Experience Intern', status: 'oa', priority: 'high', deadlineOffset: 3, appliedOffset: -7, boardOrder: 0 },
    { company: 'Stripe', title: 'Backend Engineer Intern', status: 'interview', priority: 'high', deadlineOffset: null, appliedOffset: -14, boardOrder: 0 },
    { company: 'Linear', title: 'Design Engineer', status: 'interview', priority: 'medium', deadlineOffset: null, appliedOffset: -10, boardOrder: 1 },
    { company: 'Figma', title: 'Frontend Intern', status: 'hr', priority: 'high', deadlineOffset: null, appliedOffset: -21, boardOrder: 0 },
    { company: 'Vercel', title: 'Solutions Engineer Intern', status: 'offer', priority: 'high', deadlineOffset: null, appliedOffset: -28, boardOrder: 0 },
    { company: 'Anthropic', title: 'ML Infra Intern', status: 'rejected', priority: 'low', deadlineOffset: null, appliedOffset: -35, boardOrder: 0 },
    { company: 'Stripe', title: 'PM Intern', status: 'archived', priority: 'low', deadlineOffset: null, appliedOffset: -60, boardOrder: 0 },
  ];

  const inserted = await db
    .insert(schema.applications)
    .values(
      seeds.map((s) => ({
        userId: user.id,
        companyId: byName[s.company]!.id,
        title: s.title,
        currentStatus: s.status,
        priority: s.priority,
        boardOrder: s.boardOrder,
        deadlineAt: s.deadlineOffset != null ? addDays(now, s.deadlineOffset) : null,
        appliedAt: s.appliedOffset != null ? addDays(now, s.appliedOffset) : null,
        location: byName[s.company]!.location,
        source: 'Company Careers',
        sourceUrl: `https://${byName[s.company]!.name.toLowerCase()}.com/careers`,
      }))
    )
    .returning();

  // 4. Some events (interviews / OAs / deadlines) on a few of them
  const findApp = (companyName: string, title: string) =>
    inserted.find((a) => a.title === title && a.companyId === byName[companyName]!.id)!;

  const stripeBackend = findApp('Stripe', 'Backend Engineer Intern');
  const vercelOA = findApp('Vercel', 'Developer Experience Intern');
  const figmaHR = findApp('Figma', 'Frontend Intern');

  await db.insert(schema.applicationEvents).values([
    {
      applicationId: stripeBackend.id,
      eventType: 'interview',
      title: 'Technical phone screen with Alex',
      startsAt: addDays(now, 2),
      endsAt: addDays(now, 2),
      reminderAt: addDays(now, 2),
    },
    {
      applicationId: vercelOA.id,
      eventType: 'oa',
      title: 'HackerRank assessment',
      startsAt: addDays(now, 3),
      reminderAt: addDays(now, 2),
    },
    {
      applicationId: figmaHR.id,
      eventType: 'interview',
      title: 'HR screen',
      startsAt: addDays(now, 5),
      reminderAt: addDays(now, 4),
    },
  ]);

  await db.insert(schema.applicationNotes).values([
    {
      applicationId: stripeBackend.id,
      noteType: 'followup',
      content: 'Reached out to alum on LinkedIn for referral context.',
    },
    {
      applicationId: figmaHR.id,
      noteType: 'interview_feedback',
      content: 'HR screen went well — they will follow up within a week.',
    },
  ]);

  console.log(`  inserted ${inserted.length} applications`);
  console.log('Done. Sign in as demo@jobflow.local / demo1234');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

void subDays; // reserved for future use
