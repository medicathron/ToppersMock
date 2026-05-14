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
      id: "sso",
      name: "SSO",
      credentials: { token: { type: "text" } },
      async authorize(credentials) {
        const raw = credentials?.token as string | undefined;
        if (!raw) return null;
        const dotIdx = raw.lastIndexOf(".");
        if (dotIdx === -1) return null;
        const payload = raw.slice(0, dotIdx);
        const sig = raw.slice(dotIdx + 1);
        const crypto = await import("crypto");
        const expected = crypto
          .createHmac("sha256", process.env.TOPPERS_SSO_SECRET ?? "")
          .update(payload)
          .digest("hex");
        if (sig !== expected) return null;

        let data: { tutorialId: string; exp: number };
        try {
          data = JSON.parse(Buffer.from(payload, "base64url").toString());
        } catch { return null; }
        if (data.exp < Math.floor(Date.now() / 1000)) return null;

        const { tutorialId } = data;
        let allowed = await prisma.allowedStudent.findUnique({ where: { matric: tutorialId } });
        if (!allowed) {
          allowed = await prisma.allowedStudent.create({
            data: { matric: tutorialId, tutorId: "toppers-tutorial", registered: true },
          });
        }

        let user = allowed.userId
          ? await prisma.user.findUnique({ where: { id: allowed.userId } })
          : null;
        if (!user) {
          user = await prisma.user.create({ data: { matric: tutorialId, role: "STUDENT" } });
          await prisma.allowedStudent.update({
            where: { matric: tutorialId },
            data: { userId: user.id, registered: true },
          });
        }

        return { id: user.id, matric: tutorialId, role: "STUDENT", needsRegistration: false } as never;
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
