import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { getServerDictionary } from '@/lib/i18n/server';
import { getRuntimeHealth } from '@/lib/runtime-env';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const t = getServerDictionary();
  const readiness = await getRuntimeHealth();
  if (!readiness.ok) {
    return NextResponse.json(
      {
        code: readiness.code,
        error:
          readiness.code === 'env_invalid'
            ? t.auth.errors.envInvalid
            : t.auth.errors.dbUnavailable,
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: 'invalid_json', error: t.auth.errors.invalidJson },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: 'invalid_input', error: t.common.invalidInput, issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json(
        { code: 'email_taken', error: t.auth.errors.emailTaken },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await db.insert(users).values({
      name: parsed.data.name,
      email,
      passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { code: 'db_unreachable', error: t.auth.errors.dbUnavailable },
      { status: 503 }
    );
  }
}
