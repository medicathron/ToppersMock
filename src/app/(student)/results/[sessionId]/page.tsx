import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const OPT_LABELS = ["A", "B", "C", "D"];

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

  return (
    <div>
      <Link href="/profile" style={{ color: "var(--muted)", fontSize: 13 }} className="block mb-4">← Back to Profile</Link>

      <div
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}
        className="p-6 mb-6"
      >
        <p style={{ color: "var(--orange)", fontWeight: 700, fontSize: 13 }}>{course.code} — {course.name}</p>
        {!released ? (
          <div className="mt-3">
            <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 20 }}>Quiz Submitted!</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }} className="mt-1">
              Your results will be visible once your tutor releases them.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-6 mt-3">
            <div>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Score</p>
              <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 36 }}>{score}/{numQuestions}</p>
            </div>
            <div>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Percentage</p>
              <p style={{
                fontWeight: 700, fontSize: 36,
                color: pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)",
              }}>{pct}%</p>
            </div>
            <div>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>Questions</p>
              <p style={{ color: "var(--dark)", fontWeight: 700, fontSize: 36 }}>{numQuestions}</p>
            </div>
          </div>
        )}
      </div>

      {released && (
        <div>
          <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 18 }} className="mb-4">Answer Review</h2>
          <div className="flex flex-col gap-3">
            {answers.map((a, idx) => {
              const opts: string[] = JSON.parse(a.shuffledOptions);
              const correct = a.shuffledCorrectIndex;
              const selected = a.selectedOption;

              return (
                <div
                  key={a.id}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${a.isCorrect ? "var(--green)" : "var(--red)"}`,
                    borderRadius: 12,
                  }}
                  className="p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span style={{
                      minWidth: 24, height: 24, borderRadius: 6,
                      background: a.isCorrect ? "var(--green)" : "var(--red)",
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {a.isCorrect ? "✓" : "✗"}
                    </span>
                    <p style={{ color: "var(--dark)", fontSize: 14, lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--muted)", fontSize: 12 }}>Q{idx + 1}. </strong>
                      {a.question.questionText}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {opts.map((opt, i) => {
                      const isCorrectOpt = i === correct;
                      const isSelectedOpt = i === selected;
                      let bg = "transparent";
                      let border = "1px solid var(--border)";
                      let color = "var(--muted)";
                      if (isCorrectOpt) { bg = "rgba(30,122,69,0.1)"; border = "1px solid var(--green)"; color = "var(--green)"; }
                      if (isSelectedOpt && !isCorrectOpt) { bg = "rgba(192,57,43,0.1)"; border = "1px solid var(--red)"; color = "var(--red)"; }
                      return (
                        <div key={i} style={{ background: bg, border, borderRadius: 6, padding: "6px 10px", fontSize: 12 }}>
                          <span style={{ color, fontWeight: 700 }}>{OPT_LABELS[i]}. </span>
                          <span style={{ color }}>{opt}</span>
                          {isCorrectOpt && <span style={{ color: "var(--green)", fontSize: 11 }}> ✓</span>}
                          {isSelectedOpt && !isCorrectOpt && <span style={{ color: "var(--red)", fontSize: 11 }}> ✗</span>}
                        </div>
                      );
                    })}
                  </div>

                  {a.question.explanation && (
                    <div style={{ background: "var(--orange-pale)", borderRadius: 6, padding: "8px 10px", marginTop: 8 }}>
                      <p style={{ color: "var(--dark)", fontSize: 12 }}>
                        <strong style={{ color: "var(--orange)" }}>Explanation: </strong>
                        {a.question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href="/quiz/select"
          style={{ background: "var(--orange)", color: "#fff", borderRadius: 8 }}
          className="px-5 py-2.5 font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Take Another Quiz
        </Link>
        <Link
          href="/profile"
          style={{ border: "1px solid var(--border)", color: "var(--dark)", borderRadius: 8 }}
          className="px-5 py-2.5 font-semibold text-sm hover:bg-orange-pale transition-colors"
        >
          Back to Profile
        </Link>
      </div>
    </div>
  );
}
