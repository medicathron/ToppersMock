import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, history] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { userId } }),
    prisma.quizSession.findMany({
      where: { studentId: userId },
      include: { course: { select: { name: true, code: true, resultsReleased: true } } },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const submitted = history.filter((h) => h.submittedAt);
  const inProgress = history.filter((h) => !h.submittedAt);

  return (
    <div>
      {/* Profile card */}
      <div
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}
        className="p-6 mb-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: "var(--font-dm-serif)", color: "var(--dark)", fontSize: 28 }}>
              {profile ? `${profile.surname} ${profile.firstname}` : "Student"}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>Matric: {session!.user.matric}</p>
            {profile && (
              <p style={{ color: "var(--muted)", fontSize: 13 }} className="mt-0.5">
                {profile.dept} · {profile.faculty}
              </p>
            )}
          </div>
          {profile && (
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Target Score</p>
              <p style={{ color: "var(--orange)", fontWeight: 700, fontSize: 24 }}>{profile.aimedScore}%</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{ background: "var(--dark)", borderRadius: 16 }}
        className="p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Ready to practice?</p>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Choose a course and start a quiz.</p>
        </div>
        <Link
          href="/quiz/select"
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
        >
          Start a Quiz
        </Link>
      </div>

      {/* In-progress sessions */}
      {inProgress.length > 0 && (
        <section className="mb-6">
          <h2 style={{ color: "var(--dark)", fontWeight: 700 }} className="mb-3">Resume In-Progress</h2>
          <div className="flex flex-col gap-2">
            {inProgress.map((s) => (
              <Link
                key={s.id}
                href={`/quiz/${s.id}`}
                style={{ background: "var(--orange-pale)", border: "1px solid var(--border)", borderRadius: 10 }}
                className="p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div>
                  <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 14 }}>{s.course.code} — {s.course.name}</p>
                  <p style={{ color: "var(--muted)", fontSize: 12 }}>Started {new Date(s.startedAt).toLocaleString()}</p>
                </div>
                <span style={{ color: "var(--orange)", fontWeight: 700, fontSize: 13 }}>Resume →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quiz history */}
      <section>
        <h2 style={{ color: "var(--dark)", fontWeight: 700 }} className="mb-3">Quiz History</h2>
        {submitted.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>No completed quizzes yet.</p>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="overflow-hidden overflow-x-auto">
            <table className="w-full" style={{ minWidth: 480 }}>
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Course", "Questions", "Score", "Date", ""].map((h) => (
                    <th key={h} style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, textAlign: "left" }} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submitted.map((s) => {
                  const pct = s.score !== null ? Math.round((s.score / s.numQuestions) * 100) : null;
                  const released = s.course.resultsReleased;
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ color: "var(--dark)", fontWeight: 600, fontSize: 13 }} className="px-4 py-3">
                        {s.course.code}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 13 }} className="px-4 py-3">{s.numQuestions}</td>
                      <td className="px-4 py-3">
                        {!released ? (
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>Pending release</span>
                        ) : pct !== null ? (
                          <span style={{ color: pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)", fontWeight: 700, fontSize: 13 }}>
                            {s.score}/{s.numQuestions} ({pct}%)
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-4 py-3">
                        {new Date(s.submittedAt!).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {released && (
                          <Link href={`/results/${s.id}`} style={{ color: "var(--orange)", fontSize: 12 }} className="hover:underline font-medium">
                            Review
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
