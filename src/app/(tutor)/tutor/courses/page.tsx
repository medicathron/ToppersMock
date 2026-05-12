import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoursesPage() {
  const session = await auth();
  const courses = await prisma.course.findMany({
    where: { tutorId: session!.user.id },
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 32 }}>Courses</h1>
        <Link
          href="/tutor/courses/new"
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div
          style={{ border: "2px dashed var(--border)", borderRadius: 12 }}
          className="p-12 text-center"
        >
          <p style={{ color: "var(--muted)" }}>No courses yet. Create your first course to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {courses.map((c) => (
            <div
              key={c.id}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
              className="p-5 flex items-center justify-between"
            >
              <div>
                <p style={{ color: "var(--orange)", fontWeight: 700, fontSize: 13 }}>{c.code}</p>
                <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 16 }}>{c.name}</p>
                {c.description && (
                  <p style={{ color: "var(--muted)", fontSize: 13 }} className="mt-0.5">{c.description}</p>
                )}
                <p style={{ color: "var(--muted)", fontSize: 12 }} className="mt-1">
                  {c._count.questions} questions · {c.timePerQuestion}s/question · {c._count.sessions} attempts
                  {c.resultsReleased && (
                    <span style={{ color: "var(--green)", fontWeight: 600 }} className="ml-2">Results released</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/tutor/courses/${c.id}/generate`}
                  style={{ border: "1px solid var(--border)", borderRadius: 8, color: "var(--dark)", fontSize: 13 }}
                  className="px-3 py-1.5 hover:bg-orange-pale transition-colors font-medium"
                >
                  Generate Qs
                </Link>
                <Link
                  href={`/tutor/courses/${c.id}`}
                  style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 13 }}
                  className="px-3 py-1.5 hover:opacity-90 transition-opacity font-medium"
                >
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
