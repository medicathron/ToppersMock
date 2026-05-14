import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TutorSidebar from "@/components/layout/TutorSidebar";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "TUTOR") redirect("/tutor/login");

  const pendingCount = await prisma.quizSession.count({
    where: {
      submittedAt: { not: null },
      course: { tutorId: session.user.id, resultsReleased: false },
    },
  });

  const links = [
    { href: "/tutor/dashboard", label: "Dashboard", icon: "dashboard" as const },
    { href: "/tutor/courses",   label: "Courses",   icon: "courses"   as const },
    { href: "/tutor/students",  label: "Students",  icon: "students"  as const },
    { href: "/tutor/results",   label: "Results",   icon: "results"   as const, badge: pendingCount || undefined },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <TutorSidebar links={links} />
      {/* pt-16 on mobile creates space for the fixed hamburger button */}
      <main className="flex-1 p-6 md:p-8 overflow-auto pt-16 md:pt-8">{children}</main>
    </div>
  );
}
