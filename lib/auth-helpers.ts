import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Use in server components / actions / route handlers that require auth.
 * Throws via redirect() rather than returning null so call sites can rely on
 * a non-null user.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user || !('id' in user) || !user.id) {
    redirect('/auth/sign-in');
  }
  return user as { id: string; email: string; name: string | null; image: string | null };
}
