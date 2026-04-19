import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe slice of the NextAuth config.
 *
 * The DB adapter and Credentials.authorize (which queries Postgres via
 * postgres-js) are NOT compatible with the Edge runtime, so we keep them
 * in `lib/auth.ts` and only import THIS file from `middleware.ts`.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: '/auth/sign-in' },
  // Required for Auth.js v5 outside of Vercel (incl. localhost behind proxies).
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthed = !!auth?.user;

      if (pathname.startsWith('/app')) return isAuthed;
      if (
        isAuthed &&
        (pathname === '/auth/sign-in' || pathname === '/auth/sign-up')
      ) {
        return Response.redirect(new URL('/app', request.nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.uid as string;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
};
