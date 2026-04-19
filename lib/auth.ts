import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { authConfig } from '@/lib/auth.config';
import { getRuntimeHealth } from '@/lib/runtime-env';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

// Phase 1 只使用 Credentials + JWT session。
// Adapter 表仍然保留在 schema 中，后续阶段再接 OAuth 能力。
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse({
          email: typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : raw?.email,
          password: raw?.password,
        });
        if (!parsed.success) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[auth] credentials failed schema validation');
          }
          return null;
        }

        const readiness = await getRuntimeHealth();
        if (!readiness.ok) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[auth] runtime health check failed:', readiness);
          }
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          if (!user || !user.passwordHash) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`[auth] no user / no passwordHash for ${email}`);
            }
            return null;
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`[auth] bcrypt mismatch for ${email}`);
            }
            return null;
          }

          return { id: user.id, email: user.email, name: user.name, image: user.image };
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[auth] authorize threw:', err);
          }
          return null;
        }
      },
    }),
  ],
});
