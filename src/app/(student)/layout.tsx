import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/login");

  // Students who need registration can only see the register page; handled by middleware
  const showNav = !session.user.needsRegistration;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {showNav && (
        <nav style={{ background: "var(--dark2)", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="px-6 py-3 flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-dm-serif)", color: "var(--orange)", fontSize: 18 }}>ToppersMock</span>
          <div className="flex items-center gap-4">
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
