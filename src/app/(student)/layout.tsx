import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  const showNav = !session.user.needsRegistration;

  let displayName: string | null = null;
  if (showNav && session.user.id) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstname: true, surname: true },
    });
    if (profile) displayName = `${profile.firstname} ${profile.surname}`;
    else displayName = session.user.matric ?? null;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {showNav && (
        <nav style={{ background: "var(--dark2)", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="px-6 py-3 flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-dm-serif)", color: "var(--orange)", fontSize: 18 }}>ToppersMock</span>
          <div className="flex items-center gap-4">
            {displayName && (
              <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 500 }}>{displayName}</span>
            )}
            <Link href="/profile" style={{ color: "var(--border)", fontSize: 13 }} className="hover:text-white transition-colors">Profile</Link>
            <Link href="/quiz/select" style={{ color: "var(--border)", fontSize: 13 }} className="hover:text-white transition-colors">Start Quiz</Link>
            <Link href="/api/auth/signout" style={{ color: "var(--muted)", fontSize: 13 }} className="hover:text-white transition-colors">Sign out</Link>
          </div>
        </nav>
      )}
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
