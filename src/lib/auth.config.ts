import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Prisma/Node.js-only modules)
// Used by middleware for JWT verification only
export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: string; matric?: string; email?: string; needsRegistration?: boolean };
        token.id = u.id;
        token.role = u.role;
        token.matric = u.matric;
        token.email = u.email;
        token.needsRegistration = u.needsRegistration ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.matric = token.matric as string | undefined;
      session.user.needsRegistration = token.needsRegistration as boolean;
      return session;
    },
  },
};
