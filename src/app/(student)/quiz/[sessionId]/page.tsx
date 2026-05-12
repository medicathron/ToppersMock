"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface QuizAnswer {
  id: string;
  questionOrder: number;
  questionText: string;
  shuffledOptions: string[];
  selectedOption: number | null;
}

interface QuizSessionData {
  id: string;
  numQuestions: number;
  timeLimitSeconds: number;
  timeElapsed: number;
  submittedAt: string | null;
  course: { name: string; code: string };
  answers: QuizAnswer[];
}

const OPT_LABELS = ["A", "B", "C", "D"];

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<QuizSessionData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [display, setDisplay] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);

  const timeLeftRef = useRef(0);
  const isSubmittedRef = useRef(false);
  const visTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Submit function — always server-side
  const submit = useCallback(async () => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setSubmitting(true);

    // Save final answers first
    const currentAnswers = Object.entries(answers).map(([id, selectedOption]) => ({
      id,
      selectedOption: selectedOption ?? null,
    }));
    await fetch(`/api/quiz/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeElapsed: timeLeftRef.current, answers: currentAnswers }),
    });

    await fetch(`/api/quiz/${sessionId}/submit`, { method: "POST" });
    router.push(`/results/${sessionId}`);
  }, [sessionId, answers, router]);

  // Load session
  useEffect(() => {
    fetch(`/api/quiz/${sessionId}`)
      .then((r) => r.json())
      .then((data: QuizSessionData) => {
        if (data.submittedAt) {
          router.push(`/results/${sessionId}`);
          return;
        }
        setSession(data);
        const remaining = data.timeLimitSeconds - data.timeElapsed;
        timeLeftRef.current = Math.max(remaining, 0);
        setDisplay(Math.max(remaining, 0));

        // Restore any saved answers
        const saved: Record<string, number | null> = {};
        data.answers.forEach((a) => {
          saved[a.id] = a.selectedOption;
        });
        setAnswers(saved);
      });
  }, [sessionId, router]);

  // Countdown timer
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      timeLeftRef.current = Math.max(timeLeftRef.current - 1, 0);
      setDisplay(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(id);
        submit();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [session, submit]);

  // Sync answers + timeElapsed every 10s
  useEffect(() => {
    if (!session) return;
    syncTimerRef.current = setInterval(() => {
      if (isSubmittedRef.current) return;
      const toSync = Object.entries(answers).map(([id, selectedOption]) => ({ id, selectedOption }));
      fetch(`/api/quiz/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeElapsed: session.timeLimitSeconds - timeLeftRef.current, answers: toSync }),
      });
    }, 10000);
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [session, sessionId, answers]);

  // Anti-cheat: tab visibility
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && !isSubmittedRef.current) {
        setTabWarning(true);
        visTimerRef.current = setTimeout(() => {
          if (document.hidden && !isSubmittedRef.current) submit();
        }, 2000);
      } else {
        setTabWarning(false);
        if (visTimerRef.current) clearTimeout(visTimerRef.current);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (visTimerRef.current) clearTimeout(visTimerRef.current);
    };
  }, [submit]);

  // Beforeunload
  useEffect(() => {
    function handleUnload(e: BeforeUnloadEvent) {
      if (!isSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: "var(--muted)" }}>Loading quiz…</p>
      </div>
    );
  }

  const q = session.answers[currentQ];
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;

  // Timer display + color
  const mins = Math.floor(display / 60).toString().padStart(2, "0");
  const secs = (display % 60).toString().padStart(2, "0");
  const timerColor = display <= 60 ? "var(--red)" : display <= 300 ? "var(--orange)" : "#fff";
  const timerPulse = display <= 60 && display > 0;

  function selectAnswer(optIdx: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--dark)", padding: 0, margin: 0 }}>
      {/* Header bar */}
      <div
        style={{ background: "var(--dark2)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px" }}
        className="flex items-center justify-between"
      >
        <span style={{ color: "var(--border)", fontSize: 14, fontWeight: 600 }}>
          {session.course.code} — {session.course.name}
        </span>
        <div className="flex items-center gap-4">
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {answeredCount}/{session.numQuestions} answered
          </span>
          <span
            style={{ color: timerColor, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}
            className={timerPulse ? "pulse-timer" : ""}
          >
            {mins}:{secs}
          </span>
        </div>
      </div>

      {tabWarning && (
        <div style={{ background: "var(--red)", color: "#fff", padding: "8px 16px", textAlign: "center", fontSize: 13, fontWeight: 600 }}>
          ⚠ You left the quiz tab! Return now or the quiz will auto-submit in 2 seconds.
        </div>
      )}

      <div className="flex gap-0" style={{ height: "calc(100vh - 53px)" }}>
        {/* Question navigator dots */}
        <div
          style={{ background: "var(--dark2)", width: 72, padding: "12px 8px", overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.06)" }}
          className="flex flex-col gap-1 items-center"
        >
          {session.answers.map((a, i) => {
            const isAnswered = answers[a.id] !== null && answers[a.id] !== undefined;
            const isCurrent = i === currentQ;
            return (
              <button
                key={a.id}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 32, height: 32, borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: isCurrent ? "var(--orange)" : isAnswered ? "rgba(255,255,255,0.15)" : "transparent",
                  color: isCurrent ? "#fff" : isAnswered ? "#fff" : "var(--muted)",
                  border: isCurrent ? "none" : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question area */}
        <div className="flex-1 flex flex-col p-6 overflow-auto">
          <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>
            Question {currentQ + 1} of {session.numQuestions}
          </p>

          <div style={{ background: "var(--dark2)", borderRadius: 12, padding: "20px 24px" }} className="mb-5">
            <p style={{ color: "#fff", fontSize: 16, lineHeight: 1.6 }}>{q.questionText ?? "Loading…"}</p>
          </div>

          <div className="flex flex-col gap-3">
            {(q.shuffledOptions ?? []).map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  style={{
                    background: selected ? "var(--orange)" : "var(--dark2)",
                    border: `1.5px solid ${selected ? "var(--orange)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10, padding: "12px 16px",
                    color: selected ? "#fff" : "var(--border)",
                    textAlign: "left", fontSize: 14, cursor: "pointer",
                  }}
                  className="flex items-start gap-3 hover:opacity-80 transition-opacity"
                >
                  <span style={{
                    minWidth: 28, height: 28, borderRadius: 6,
                    background: selected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 12,
                  }}>
                    {OPT_LABELS[i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentQ((q) => Math.max(q - 1, 0))}
              disabled={currentQ === 0}
              style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "var(--border)", fontSize: 13 }}
              className="px-5 py-2 hover:opacity-80 disabled:opacity-30 transition-opacity"
            >
              ← Previous
            </button>

            {currentQ < session.numQuestions - 1 ? (
              <button
                onClick={() => setCurrentQ((q) => q + 1)}
                style={{ background: "var(--orange)", color: "#fff", borderRadius: 8, fontSize: 13 }}
                className="px-5 py-2 hover:opacity-90 transition-opacity"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                style={{ background: "var(--green)", color: "#fff", borderRadius: 8, fontSize: 13 }}
                className="px-5 py-2 hover:opacity-90 transition-opacity font-semibold"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "var(--surface)", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%" }}>
            <h2 style={{ color: "var(--dark)", fontWeight: 700, fontSize: 18 }} className="mb-2">Submit Quiz?</h2>
            <p style={{ color: "var(--muted)", fontSize: 14 }} className="mb-4">
              You have answered {answeredCount} of {session.numQuestions} questions.
              {answeredCount < session.numQuestions && (
                <span style={{ color: "var(--red)", fontWeight: 600 }}> {session.numQuestions - answeredCount} unanswered.</span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, color: "var(--dark)", fontSize: 14 }}
                className="py-2 font-medium hover:bg-orange-pale transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => { setShowModal(false); submit(); }}
                disabled={submitting}
                style={{ flex: 1, background: "var(--green)", color: "#fff", borderRadius: 8, fontSize: 14 }}
                className="py-2 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
