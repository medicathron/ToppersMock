import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileCard from "@/components/profile/ProfileCard";

function computeStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const unique = [...new Set(dates.map((d) => d.toDateString()))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let expected = today.getTime();
  for (const ds of unique) {
    const day = new Date(ds);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((expected - day.getTime()) / 86400000);
    if (diffDays <= 1) { streak++; expected = day.getTime() - 86400000; }
    else break;
  }
  return streak;
}

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

  // Stats
  const releasedSubmitted = submitted.filter((s) => s.course.resultsReleased && s.score !== null);
  const avgScore = releasedSubmitted.length
    ? Math.round(releasedSubmitted.reduce((sum, s) => sum + Math.round((s.score! / s.numQuestions) * 100), 0) / releasedSubmitted.length)
    : null;
  const bestScore = releasedSubmitted.length
    ? Math.max(...releasedSubmitted.map((s) => Math.round((s.score! / s.numQuestions) * 100)))
    : null;
  const streak = computeStreak(submitted.map((s) => s.submittedAt!));

  // Last 5 released scores for trend bars
  const trend = releasedSubmitted.slice(0, 5).reverse().map((s) => ({
    pct: Math.round((s.score! / s.numQuestions) * 100),
    code: s.course.code,
  }));

  const statItems = [
    { label: "Quizzes", value: submitted.length, color: "var(--dark)" },
    { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "—", color: avgScore !== null && avgScore >= 70 ? "var(--green)" : avgScore !== null && avgScore >= 50 ? "var(--orange)" : "var(--dark)" },
    { label: "Best Score", value: bestScore !== null ? `${bestScore}%` : "—", color: "var(--orange)" },
    { label: "Streak", value: streak > 0 ? `${streak}d 🔥` : "—", color: streak > 0 ? "var(--orange)" : "var(--dark)" },
  ];

  return (
    <div>
      {/* Profile card with inline edit */}
      {profile ? (
        <ProfileCard
          profile={{
            firstname: profile.firstname,
            surname: profile.surname,
            phone: profile.phone,
            faculty: profile.faculty,
            dept: profile.dept,
            aimedScore: profile.aimedScore,
          }}
          matric={session!.user.matric ?? ""}
        />
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }} className="p-6 mb-6">
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Profile not set up yet.</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statItems.map(({ label, value, color }) => (
          <div
            key={label}
            className="stat-card"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}
          >
            <p style={{ color: "var(--muted)", fontSize: 12 }}>{label}</p>
            <p style={{ color, fontWeight: 700, fontSize: 22, marginTop: 2 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Score trend bars */}
      {trend.length > 0 && (
        <div
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
          className="p-4 mb-6"
        >
          <p style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Recent Score Trend</p>
          <div className="flex items-end gap-2" style={{ height: 60 }}>
            {trend.map((t, i) => (
              <div key={i} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
                <p style={{ color: "var(--muted)", fontSize: 10 }}>{t.pct}%</p>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(4, (t.pct / 100) * 40)}px`,
                    background: t.pct >= 70 ? "var(--green)" : t.pct >= 50 ? "var(--orange)" : "var(--red)",
                    borderRadius: 4,
                    minHeight: 4,
                  }}
                />
                <p style={{ color: "var(--muted)", fontSize: 9, textAlign: "center", lineHeight: 1.2 }}>{t.code}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div
        style={{ background: "var(--dark)", borderRadius: 16 }}
        className="p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Ready to practice?</p>
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
          <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 15 }} className="mb-3">Resume In-Progress</h2>
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
        <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 15 }} className="mb-3">Quiz History</h2>
        {submitted.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-8 text-center">
            <p style={{ color: "var(--muted)", fontSize: 24 }}>📝</p>
            <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 14, marginTop: 8 }}>No quizzes yet</p>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Your completed quizzes will appear here.</p>
          </div>
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
                  const scoreColor = pct !== null && pct >= 70 ? "var(--green)" : pct !== null && pct >= 50 ? "var(--orange)" : "var(--red)";
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3">
                        <p style={{ color: "var(--dark)", fontWeight: 600, fontSize: 13 }}>{s.course.code}</p>
                        <p style={{ color: "var(--muted)", fontSize: 11 }}>{s.course.name}</p>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 13 }} className="px-4 py-3">{s.numQuestions}</td>
                      <td className="px-4 py-3">
                        {!released ? (
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>Pending</span>
                        ) : pct !== null ? (
                          <div>
                            <span style={{ color: scoreColor, fontWeight: 700, fontSize: 13 }}>
                              {s.score}/{s.numQuestions} ({pct}%)
                            </span>
                            <div style={{ height: 3, background: "var(--border)", borderRadius: 99, marginTop: 3, width: 60 }}>
                              <div style={{ height: "100%", background: scoreColor, borderRadius: 99, width: `${pct}%` }} />
                            </div>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }} className="px-4 py-3">
                        {new Date(s.submittedAt!).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {released && (
                          <Link href={`/results/${s.id}`} style={{ color: "var(--orange)", fontSize: 12 }} className="hover:underline font-medium">
                            Review →
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
