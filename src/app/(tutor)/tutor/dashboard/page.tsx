import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function TutorDashboard() {
  const session = await auth();
  const tutorId = session!.user.id;

  const [courses, studentCount, recentSessions, pendingCount, totalQuestions] = await Promise.all([
    prisma.course.findMany({
      where: { tutorId },
      select: { id: true, name: true, code: true, _count: { select: { questions: true, sessions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.allowedStudent.count({ where: { tutorId } }),
    prisma.quizSession.findMany({
      where: { course: { tutorId } },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        student: { include: { studentProfile: true } },
        course: { select: { name: true, code: true } },
      },
    }),
    prisma.quizSession.count({
      where: { submittedAt: { not: null }, course: { tutorId, resultsReleased: false } },
    }),
    prisma.question.count({ where: { course: { tutorId } } }),
  ]);

  const stats = [
    { label: "Students", value: studentCount, href: "/tutor/students", color: "var(--dark)" },
    { label: "Questions", value: totalQuestions, href: "/tutor/courses", color: "var(--dark)" },
    { label: "Courses", value: courses.length, href: "/tutor/courses", color: "var(--dark)" },
    { label: "Pending Release", value: pendingCount, href: "/tutor/results", color: pendingCount > 0 ? "var(--orange)" : "var(--dark)" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 30 }}>
          Dashboard
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/tutor/courses/new"
            style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 13 }}
            className="px-4 py-2 font-semibold hover:opacity-90 transition-opacity"
          >
            + New Course
          </Link>
          <Link
            href="/tutor/students"
            style={{ border: "1px solid var(--border)", color: "var(--dark)", borderRadius: 8, fontSize: 13 }}
            className="px-4 py-2 font-medium hover:bg-orange-pale transition-colors"
          >
            + Add Student
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ label, value, href, color }) => (
          <Link
            key={label}
            href={href}
            className="stat-card"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", display: "block" }}
          >
            <p style={{ color: "var(--muted)", fontSize: 12 }}>{label}</p>
            <p style={{ color, fontWeight: 700, fontSize: 28, marginTop: 2 }}>{value}</p>
            {label === "Pending Release" && value > 0 && (
              <p style={{ color: "var(--orange)", fontSize: 11, marginTop: 2 }}>Tap to release →</p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Courses */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 15 }}>Your Courses</h2>
            <Link href="/tutor/courses/new" style={{ color: "var(--orange)", fontSize: 13, fontWeight: 600 }}>
              + New
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-6">
              <p style={{ color: "var(--muted)", fontSize: 24 }}>📚</p>
              <p style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600, marginTop: 6 }}>No courses yet</p>
              <Link href="/tutor/courses/new" style={{ color: "var(--orange)", fontSize: 12 }} className="mt-1 block">Create your first course →</Link>
            </div>
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
                    <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 13 }}>{c.code}</p>
                    <p style={{ color: "var(--muted)", fontSize: 11 }}>{c.name}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>{c._count.questions} Qs</span>
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>{c._count.sessions} attempts</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 15 }}>Recent Activity</h2>
            <Link href="/tutor/results" style={{ color: "var(--orange)", fontSize: 13, fontWeight: 600 }}>
              View all
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-center py-6">
              <p style={{ color: "var(--muted)", fontSize: 24 }}>📋</p>
              <p style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600, marginTop: 6 }}>No activity yet</p>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>Quiz attempts will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentSessions.map((s) => {
                const profile = s.student.studentProfile;
                const pct = s.submittedAt && s.score !== null
                  ? Math.round((s.score / s.numQuestions) * 100)
                  : null;
                const scoreColor = pct !== null && pct >= 70 ? "var(--green)" : pct !== null && pct >= 50 ? "var(--orange)" : "var(--red)";
                return (
                  <div
                    key={s.id}
                    style={{ border: "1px solid var(--border)", borderRadius: 8 }}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p style={{ color: "var(--dark)", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {profile ? `${profile.surname} ${profile.firstname}` : "Unknown"}
                      </p>
                      <p style={{ color: "var(--muted)", fontSize: 11 }}>
                        {s.course.code} · {timeAgo(new Date(s.startedAt))}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {s.submittedAt && pct !== null ? (
                        <span style={{ color: scoreColor, fontWeight: 700, fontSize: 13 }}>{pct}%</span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: 11 }}>In progress</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
