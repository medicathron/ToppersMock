import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentNav from "@/components/layout/StudentNav";

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
      {showNav && <StudentNav displayName={displayName} />}
      {/* pb-20 on mobile gives space above the fixed bottom tab bar */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-20 sm:pb-8">{children}</main>
    </div>
  );
}
