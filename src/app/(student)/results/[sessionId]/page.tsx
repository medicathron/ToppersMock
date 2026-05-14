import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ResultsAccordion from "@/components/results/ResultsAccordion";

export default async function ResultsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { sessionId } = await params;

  const quizSession = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      course: { select: { name: true, code: true, resultsReleased: true } },
      answers: {
        orderBy: { questionOrder: "asc" },
        include: { question: { select: { questionText: true, explanation: true } } },
      },
    },
  });

  if (!quizSession || quizSession.studentId !== session.user.id) redirect("/profile");
  if (!quizSession.submittedAt) redirect(`/quiz/${sessionId}`);

  const { course, answers, score, numQuestions } = quizSession;
  const pct = score !== null ? Math.round((score / numQuestions) * 100) : 0;
  const released = course.resultsReleased;
  const scoreColor = pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)";

  // SVG ring constants — radius 45, circumference = 2π×45 ≈ 283
  const CIRC = 283;
  const dashOffset = CIRC - (CIRC * pct) / 100;

  // Student rank for this course
  let rank: { position: number; total: number } | null = null;
  if (released && score !== null) {
    const allSessions = await prisma.quizSession.findMany({
      where: { courseId: quizSession.courseId, submittedAt: { not: null }, score: { not: null } },
      select: { studentId: true, score: true },
    });
    const best: Record<string, number> = {};
    for (const s of allSessions) {
      const existing = best[s.studentId] ?? -1;
      if ((s.score ?? 0) > existing) best[s.studentId] = s.score ?? 0;
    }
    const sorted = Object.values(best).sort((a, b) => b - a);
    const myBest = best[session.user.id] ?? score;
    const pos = sorted.findIndex((v) => v <= myBest) + 1;
    rank = { position: pos, total: sorted.length };
  }

  return (
    <div>
      <Link href="/profile" style={{ color: "var(--muted)", fontSize: 13 }} className="block mb-4">← Back to Profile</Link>

      {/* Score card */}
      <div
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}
        className="p-6 mb-6"
      >
        <p style={{ color: "var(--orange)", fontWeight: 700, fontSize: 13 }}>{course.code} — {course.name}</p>

        {!released ? (
          <div className="mt-4">
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>📬</div>
            <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 20, textAlign: "center" }}>Quiz Submitted!</p>
            <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", marginTop: 6 }}>
              Your results will be visible once your tutor releases them.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
            {/* SVG ring */}
            <div style={{ flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  className="score-ring-circle"
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="46" textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: scoreColor, fontFamily: "monospace" }}>{pct}%</text>
                <text x="50" y="62" textAnchor="middle" style={{ fontSize: 9, fill: "var(--muted)", fontFamily: "sans-serif" }}>{score}/{numQuestions}</text>
              </svg>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-5">
              <div>
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Score</p>
                <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 28 }}>{score}/{numQuestions}</p>
              </div>
              <div>
                <p style={{ color: "var(--muted)", fontSize: 12 }}>Percentage</p>
                <p style={{ fontWeight: 700, fontSize: 28, color: scoreColor }}>{pct}%</p>
              </div>
              {rank && (
                <div>
                  <p style={{ color: "var(--muted)", fontSize: 12 }}>Class Rank</p>
                  <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 28 }}>
                    #{rank.position}
                    <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 400 }}> / {rank.total}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Answer review */}
      {released && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 16 }}>Answer Review</h2>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>Tap a question to expand</p>
          </div>
          <ResultsAccordion answers={answers as Parameters<typeof ResultsAccordion>[0]["answers"]} />
        </div>
      )}

      {/* CTA buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link
          href="/quiz/select"
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity text-center"
        >
          Take Another Quiz
        </Link>
        <Link
          href="/profile"
          style={{ border: "1px solid var(--border)", color: "var(--dark)", borderRadius: 8 }}
          className="px-5 py-2.5 font-semibold text-sm hover:bg-orange-pale transition-colors text-center"
        >
          Back to Profile
        </Link>
      </div>
    </div>
  );
}
