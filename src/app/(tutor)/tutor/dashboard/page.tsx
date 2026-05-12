import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TutorDashboard() {
  const session = await auth();
  const tutorId = session!.user.id;

  const [courses, studentCount, recentSessions] = await Promise.all([
    prisma.course.findMany({ where: { tutorId }, select: { id: true, name: true, code: true, _count: { select: { questions: true, sessions: true } } } }),
    prisma.allowedStudent.count({ where: { tutorId } }),
    prisma.quizSession.findMany({
      where: { course: { tutorId } },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { student: { include: { studentProfile: true } }, course: { select: { name: true, code: true } } },
    }),
  ]);

  const statCard = (label: string, value: string | number) => (
    <div
      key={label}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
      className="p-5"
    >
      <p style={{ color: "var(--muted)", fontSize: 13 }}>{label}</p>
      <p style={{ color: "var(--dark)", fontSize: 32, fontWeight: 700 }}>{value}</p>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 32 }} className="mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCard("Courses", courses.length)}
        {statCard("Students", studentCount)}
        {statCard("Total Quiz Attempts", recentSessions.length)}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Courses */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: "var(--dark)", fontWeight: 700 }}>Your Courses</h2>
            <Link href="/tutor/courses/new" style={{ color: "var(--orange)", fontSize: 13 }} className="font-semibold">
              + New Course
            </Link>
          </div>
          {courses.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No courses yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {courses.map((c) => (
                <Link
                  key={c.id}
                  href={`/tutor/courses/${c.id}`}
                  style={{ border: "1px solid var(--border)", borderRadius: 8 }}
                  className="p-3 flex justify-between items-center hover:bg-orange-pale transition-colors"
                >
                  <div>
                    <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 14 }}>{c.code}</p>
                    <p style={{ color: "var(--muted)", fontSize: 12 }}>{c.name}</p>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>{c._count.questions} Qs</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5">
          <h2 style={{ color: "var(--dark)", fontWeight: 700 }} className="mb-4">Recent Quiz Attempts</h2>
          {recentSessions.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No quiz attempts yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSessions.map((s) => (
                <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 8 }} className="p-3">
                  <p style={{ color: "var(--dark)", fontSize: 14, fontWeight: 600 }}>
                    {s.student.studentProfile?.surname ?? "Student"} — {s.course.code}
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: 12 }}>
                    {s.submittedAt ? `Score: ${s.score}/${s.numQuestions}` : "In progress"}
                    {" · "}
                    {new Date(s.startedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
