import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "student",
      name: "Student",
      credentials: {
        matric: { label: "Matric Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const matric = (credentials?.matric as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        if (!matric || !password) return null;

        const allowed = await prisma.allowedStudent.findUnique({ where: { matric } });
        if (!allowed) return null;

        if (!allowed.registered || !allowed.userId) {
          return { id: "pending-" + matric, matric, needsRegistration: true, role: "STUDENT" } as never;
        }

        const user = await prisma.user.findUnique({ where: { id: allowed.userId } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, matric: user.matric ?? matric, role: "STUDENT", needsRegistration: false } as never;
      },
    }),
    Credentials({
      id: "tutor",
      name: "Tutor",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== "TUTOR" || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email ?? email, role: "TUTOR" } as never;
      },
    }),
  ],
});
